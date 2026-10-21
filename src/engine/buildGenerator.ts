import type { ArmorPiece, ArmorSlot, Weapon, WeaponType } from '../types/armor'
import type { Charm } from '../types/charm'
import type { Decoration } from '../types/decoration'
import type { ArmorSkill } from '../types/skill'
import type { SkillDefinition } from '../types/skillDefinition'
import type { SetBonusDefinition } from '../types/setBonus'
import type { EquippedDecoration, DecorationLocation } from '../types/equipment'
import type { BuildGeneratorRequest, BuildGeneratorResult, FixedWeaponBuildGeneratorRequest } from '../types/buildGenerator'
import { calculateBuildStats } from './buildCalculator'
import { calculateSetBonuses, getActiveSetBonusSkills } from './setBonuses'
import { serializeBuild } from './buildSerializer'
import { isFatalisArmor } from './equipmentFilters'

export interface GeneratorDatabase {
  armors: ArmorPiece[]
  weapons: Weapon[]
  charms: Charm[]
  decorations: Decoration[]
  skills: SkillDefinition[]
  setBonuses: SetBonusDefinition[]
}

interface SearchLimits {
  maxNodes?: number
  maxTimeMs?: number
  distinctArmorLayouts?: boolean
  refine?: boolean
}

interface SearchSlot {
  size: number
  location: DecorationLocation
}

interface RankedBuild {
  layout: string[]
  combination: string
  build: BuildGeneratorResult['builds'][number]
  excess: number
  decorationCount: number
  freeSlotScore: number
}

const armorSlots: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']
const maxLayoutCandidates = 48

function validateFixedArmor(
  requested: Partial<Record<ArmorSlot, string>> | undefined,
  rank: ArmorPiece['rank'],
  database: GeneratorDatabase,
  excludeFatalis = false,
): Partial<Record<ArmorSlot, string>> {
  const fixedArmor: Partial<Record<ArmorSlot, string>> = {}
  for (const [slotValue, id] of Object.entries(requested ?? {})) {
    if (!armorSlots.includes(slotValue as ArmorSlot)) {
      throw new Error('A fixed armor piece uses an invalid slot.')
    }
    const slot = slotValue as ArmorSlot
    const piece = database.armors.find((armor) => armor.id === id)
    if (!piece || piece.slot !== slot) {
      throw new Error('A fixed armor piece does not match its selected slot.')
    }
    if (piece.rank !== rank) {
      throw new Error('A fixed armor piece must match the selected armor rank.')
    }
    if (excludeFatalis && isFatalisArmor(piece)) {
      throw new Error('A fixed Fatalis armor piece conflicts with excluding Fatalis armor.')
    }
    fixedArmor[slot] = piece.id
  }
  return fixedArmor
}

/** Bounded search for up to three valid builds, without damage ranking. */
export function generateBuilds(
  request: FixedWeaponBuildGeneratorRequest,
  database: GeneratorDatabase,
  limits: SearchLimits = {},
): BuildGeneratorResult {
  const started = performance.now()
  const maxNodes = limits.maxNodes ?? 200_000
  const maxTimeMs = limits.maxTimeMs ?? 10_000
  let visitedNodes = 0
  let limited = false
  let sampled = false
  let jewelBudget = 0
  let phaseCandidates = 0
  const phaseLayouts = new Set<string>()
  let phaseStartNodes = 0
  let phaseStopped = false
  let refining = false
  let refinementStopped = false
  let refinementEndNodes = maxNodes
  let searchStopped = false
  const refinementReserve = limits.refine === false || maxNodes < 4096 ? 0 : Math.min(5_000, Math.floor(maxNodes / 20))
  const phaseNodeBudget = Math.max(256, Math.floor(maxNodes / 16))
  const rankedBuilds = new Map<string, RankedBuild>()
  let worstRetained: RankedBuild | undefined
  const compareBuilds = (a: RankedBuild, b: RankedBuild) =>
    a.decorationCount - b.decorationCount || a.excess - b.excess || b.freeSlotScore - a.freeSlotScore ||
    a.combination.localeCompare(b.combination)
  const quality = (a: RankedBuild, b: RankedBuild) =>
    a.decorationCount - b.decorationCount || a.excess - b.excess
  const weapon = request.weaponId === null ? null : database.weapons.find((entry) => entry.id === request.weaponId)
  const definitions = new Map(database.skills.map((entry) => [entry.id, entry]))
  if ((request.weaponId !== null && !weapon) || !['low', 'high', 'master'].includes(request.rank) || !request.skills.length) {
    throw new Error('Choose a weapon, armor rank and at least one required skill.')
  }
  const fixedArmor = validateFixedArmor(request.fixedArmor, request.rank, database, request.excludeFatalis)
  const mandatoryPieces = database.armors.filter((piece) => fixedArmor[piece.slot] === piece.id)
  const mandatoryRaw: Record<string, number> = {}
  for (const source of [weapon?.skills ?? [], ...mandatoryPieces.map((piece) => piece.skills),
    getActiveSetBonusSkills(calculateSetBonuses(mandatoryPieces, weapon ?? null, database.setBonuses))]) {
    for (const entry of source) mandatoryRaw[entry.skillId] = (mandatoryRaw[entry.skillId] ?? 0) + entry.level
  }
  let allowOverflow = false
  const required = new Map<string, number>()
  for (const entry of request.skills) {
    const definition = definitions.get(entry.skillId)
    if (!definition || !Number.isInteger(entry.level) || entry.level < 1 || entry.level > definition.maxLevel) {
      throw new Error('A requested skill level is invalid.')
    }
    required.set(entry.skillId, Math.max(required.get(entry.skillId) ?? 0, entry.level))
  }
  const ids = [...required.keys()]
  const secretIds = new Map<string, string>()
  for (const definition of database.skills) {
    if (definition.unlocksSkillId) secretIds.set(definition.unlocksSkillId, definition.id)
  }
  const secrets = [...required].filter(([id, level]) => {
    const definition = definitions.get(id)!
    return definition.secret && level > definition.maxLevel - definition.secret
  }).map(([id]) => ({ id, unlockId: secretIds.get(id) }))
  for (const secret of secrets) {
    if (secret.unlockId && !ids.includes(secret.unlockId)) ids.push(secret.unlockId)
  }
  if (secrets.length && !ids.includes('inheritance')) ids.push('inheritance')
  const indexes = new Map(ids.map((id, index) => [id, index]))
  const caps = ids.map((id) => required.get(id) ?? 1)
  const empty = () => ids.map(() => 0)
  const vector = (skills: ArmorSkill[]) => {
    const values = empty()
    for (const skill of skills) {
      const index = indexes.get(skill.skillId)
      if (index !== undefined) values[index] += skill.level
    }
    return values
  }
  const add = (a: number[], b: number[]) => a.map((value, index) => value + b[index])
  const meets = (values: number[]) => {
    if ([...required].some(([id, level]) => values[indexes.get(id)!] < level)) return false
    return secrets.every(({ unlockId }) =>
      (values[indexes.get('inheritance')!] ?? 0) > 0 ||
      (unlockId !== undefined && values[indexes.get(unlockId)!] > 0),
    )
  }
  const signature = (values: number[]) => values.map((value, index) => Math.min(value, caps[index])).join(',')
  const excessLevels = (values: number[]) => values.reduce((total, value, index) =>
    total + (required.has(ids[index]) ? Math.max(0, value - caps[index]) : 0), 0)
  const addRawSkills = (totals: Record<string, number>, skills: ArmorSkill[]) => {
    const next = { ...totals }
    for (const entry of skills) next[entry.skillId] = (next[entry.skillId] ?? 0) + entry.level
    return next
  }
  const extraExcess = (totals: Record<string, number>, effectiveCaps = false) =>
    Object.entries(totals).reduce((total, [id, level]) => {
      if (required.has(id)) return total
      const definition = definitions.get(id)
      if (!definition) return total
      let cap = definition.maxLevel
      if (effectiveCaps && definition.secret && !(totals.inheritance > 0) &&
        !((totals[secretIds.get(id) ?? ''] ?? 0) > 0)) cap -= definition.secret
      return total + Math.max(0, level - cap)
    }, 0)
  const exceedsCap = (totals: Record<string, number>, effective = false) => !allowOverflow && Object.entries(totals).some(([id, level]) => {
    const definition = definitions.get(id)
    if (!definition) return false
    const locked = effective && definition.secret && !(totals.inheritance > 0) && !((totals[secretIds.get(id) ?? ''] ?? 0) > 0)
    return level > Math.max(definition.maxLevel - (locked ? definition.secret! : 0), mandatoryRaw[id] ?? 0)
  })
  const skillSignature = (skills: ArmorSkill[]) => skills
    .map((entry) => `${entry.skillId}:${entry.level}`).sort().join(',')
  const visit = () => {
    if (refining) {
      if (visitedNodes >= maxNodes || performance.now() - started >= maxTimeMs) {
        refinementStopped = true
        limited = true
        return false
      }
      if (visitedNodes >= refinementEndNodes) {
        refinementStopped = true
        sampled = true
        return false
      }
      visitedNodes++
      return true
    }
    if (limited) return false
    if (visitedNodes >= maxNodes || ((visitedNodes % 128 === 0) && performance.now() - started >= maxTimeMs)) {
      limited = true
      return false
    }
    if (rankedBuilds.size && visitedNodes >= maxNodes - refinementReserve) {
      sampled = true
      phaseStopped = true
      searchStopped = true
      return false
    }
    if (visitedNodes - phaseStartNodes >= phaseNodeBudget) {
      sampled = true
      phaseStopped = true
      return false
    }
    visitedNodes++
    return true
  }
  function refineCandidates() {
    const seeds = finish().builds.map((candidate) => [...rankedBuilds.values()].find((entry) => entry.build === candidate)!)
    const armorsById = new Map(database.armors.map((piece) => [piece.id, piece]))
    const charmsById = new Map(database.charms.map((charm) => [charm.id, charm]))
    const endNodes = Math.min(maxNodes, visitedNodes + 25_000)
    const memo = new Map<string, RankedBuild | null>()
    refining = true
    phaseStopped = false
    for (let seedIndex = 0; seedIndex < seeds.length && !limited; seedIndex++) {
      const seed = seeds[seedIndex]
      let current = seed
      const charm = current.build.build.charmId ? charmsById.get(current.build.build.charmId)! : null
      refinementStopped = false
      refinementEndNodes = visitedNodes + Math.floor((endNodes - visitedNodes) / (seeds.length - seedIndex))
      // Repeated strictly improving swaps cannot cycle. A slice per seed keeps
      // the first suggestion from consuming the entire refinement budget.
      while (!stopped()) {
        jewelBudget = current.decorationCount
        const pieces = armorSlots.map((slot) => armorsById.get(current.build.build.armor[slot]!)!)
        const directValues = [weapon?.skills ?? [], charm?.skills ?? [], ...pieces.map((piece) => piece.skills)]
          .reduce((totals, source) => add(totals, vector(source)), empty())
        const neighbors = groups.flatMap((group) => group.filter((piece) => !fixedArmor[piece.slot] &&
          current.build.build.armor[piece.slot] !== piece.id).map((piece) => {
          const previous = pieces.find((entry) => entry.slot === piece.slot)!
          const next = pieces.map((entry) => entry.slot === piece.slot ? piece : entry)
          const bonuses = getActiveSetBonusSkills(calculateSetBonuses(next, weapon ?? null, database.setBonuses))
          const values = add(add(directValues, armorVector(previous).map((value) => -value)), add(armorVector(piece), vector(bonuses)))
          const missing = [...required].reduce((sum, [id, level]) => sum + Math.max(0, level - values[indexes.get(id)!]) * skillWeights[indexes.get(id)!], 0)
          return { pieces: next, missing, piece, slots: next.reduce((sum, entry) => sum + entry.slots.reduce((total, slot) => total + slot.size ** 2, 0), 0) }
        })).sort((a, b) => a.missing - b.missing || b.slots - a.slots || a.piece.id.localeCompare(b.piece.id))
        let improved = false
        for (const neighbor of neighbors) {
          const key = `${neighbor.pieces.map((piece) => piece.id).join('|')}|${charm?.id ?? ''}|${jewelBudget}`
          let candidate = memo.get(key)
          if (candidate === undefined) {
            candidate = evaluateBuild(neighbor.pieces, charm)
            if (!stopped()) memo.set(key, candidate)
          }
          const candidateKey = candidate && (limits.distinctArmorLayouts ? candidate.layout.join('|') : candidate.combination)
          const existing = candidateKey ? rankedBuilds.get(candidateKey) : undefined
          // Keep alternatives distinct instead of collapsing several seeds
          // onto the same improved armor layout.
          if (candidate && (!existing || existing === seed) && (quality(candidate, current) < 0 ||
            (quality(candidate, current) === 0 && candidate.freeSlotScore > current.freeSlotScore))) {
            current = candidate
            improved = true
            break
          }
          if (stopped()) break
        }
        if (!improved) break
      }
      if (current !== seed) {
        const oldKey = limits.distinctArmorLayouts ? seed.layout.join('|') : seed.combination
        const newKey = limits.distinctArmorLayouts ? current.layout.join('|') : current.combination
        rankedBuilds.delete(oldKey)
        const previous = rankedBuilds.get(newKey)
        if (!previous || compareBuilds(current, previous) < 0) rankedBuilds.set(newKey, current)
      }
    }
    refining = false
  }
  const stopped = () => refining ? refinementStopped : limited || phaseStopped
  const finish = (): BuildGeneratorResult => {
    const layouts = new Set<string>()
    const fallbacks: RankedBuild[] = []
    const candidates = [...rankedBuilds.values()].sort(compareBuilds).filter((entry) => {
      const key = entry.layout.join('|')
      if (layouts.has(key)) { if (!limits.distinctArmorLayouts) fallbacks.push(entry); return false }
      layouts.add(key)
      return true
    })
    if (!limits.distinctArmorLayouts && candidates.length < 3) candidates.push(...fallbacks)
    const selected = candidates.length ? [candidates[0]] : []
    const remaining = candidates.slice(1)
    const distance = (a: string[], b: string[]) =>
      a.reduce((total, family, index) => total + Number(family !== b[index]), 0)

    while (selected.length < 3 && remaining.length) {
      let bestIndex = 0
      let bestDistance = -1
      for (let index = 0; index < remaining.length; index++) {
        const minDistance = Math.min(...selected.map((entry) => distance(entry.layout, remaining[index].layout)))
        // Diversity breaks ties only after decoration count and wasted levels.
        const rank = quality(remaining[index], remaining[bestIndex])
        if (rank < 0 || (rank === 0 && minDistance > bestDistance)) {
          bestDistance = minDistance
          bestIndex = index
        }
      }
      selected.push(remaining.splice(bestIndex, 1)[0])
    }

    const builds = [
      ...selected.map((entry) => entry.build),
    ]

    return {
      builds,
      status: limited || (!builds.length && sampled) ? 'limit' : builds.length === 3 ? 'found' : 'exhausted',
      optimizationComplete: !limited && !sampled,
      visitedNodes,
      elapsedMs: performance.now() - started,
    }
  }

  // Extra skills matter too: jewels with identical requested gains can have
  // different waste when their other skills are already at the cap.
  const decorationByVector = new Map<string, { decoration: Decoration; values: number[] }>()
  for (const decoration of database.decorations) {
    const values = vector(decoration.skills)
    if (!values.some((value) => value > 0)) continue
    const key = skillSignature(decoration.skills)
    const previous = decorationByVector.get(key)
    if (!previous || decoration.slotSize < previous.decoration.slotSize) {
      decorationByVector.set(key, { decoration, values })
    }
  }
  const decorationGroups = new Map<string, { decoration: Decoration; values: number[] }[]>()
  for (const entry of decorationByVector.values()) {
    const key = entry.values.join(',')
    const group = decorationGroups.get(key) ?? []
    group.push(entry)
    decorationGroups.set(key, group)
  }
  const decorations = [...decorationGroups.values()].flatMap((group) => {
    const options = group.map((entry) => ({ ...entry, extraSkills: addRawSkills({},
      entry.decoration.skills.filter((skill) => !indexes.has(skill.skillId))) }))
    // With the same requested gains, a smaller jewel with fewer extra points
    // cannot waste more. Keep alternatives whose extra skills differ.
    const extraPoints = (entry: typeof options[number]) => Object.values(entry.extraSkills).reduce((sum, value) => sum + value, 0)
    return options.filter((entry) => !options.some((other) => other !== entry &&
      other.decoration.slotSize <= entry.decoration.slotSize &&
      Object.entries(other.extraSkills).every(([id, level]) => (entry.extraSkills[id] ?? 0) >= level) &&
      Object.entries(entry.extraSkills).every(([id, level]) =>
        !(id === 'inheritance' || definitions.get(id)?.unlocksSkillId) || other.extraSkills[id] === level,
      ) && (other.decoration.slotSize < entry.decoration.slotSize || extraPoints(other) < extraPoints(entry) ||
        other.decoration.id.localeCompare(entry.decoration.id) < 0),
    ))
  })
  const maxDecoration = Array.from({ length: 5 }, (_, size) => ids.map((_, index) =>
    Math.max(0, ...decorations.filter((entry) => entry.decoration.slotSize <= size).map((entry) => entry.values[index])),
  ))
  const relevantSets = database.setBonuses.filter((set) => set.thresholds.some((threshold) => indexes.has(threshold.skillId)))
  const relevantSetsById = new Map(relevantSets.map((set) => [set.id, set]))
  let skillWeights = caps.map((cap) => 1 / cap)
  const score = (values: number[]) => values.reduce((sum, value, index) => sum + Math.min(value, caps[index]) / caps[index], 0)
  const armorVectors = new Map<ArmorPiece, number[]>()
  const armorVector = (armor: ArmorPiece) => {
    let values = armorVectors.get(armor)
    if (!values) {
      values = vector(armor.skills)
      armorVectors.set(armor, values)
    }
    return values
  }
  const gain = (values: number[], added: number[]) => added.reduce((sum, value, index) =>
    sum + Math.min(value, Math.max(0, caps[index] - values[index])) * skillWeights[index], 0)
  let charmLookahead: (values: number[]) => number = () => 0
  const equipmentScore = (armor: ArmorPiece, values = empty(), setCounts = new Map<string, number>(), rawSkills: Record<string, number> = {}) => {
    const nextValues = add(values, armorVector(armor))
    const set = armor.setBonusId ? relevantSetsById.get(armor.setBonusId) : undefined
    const usefulSet = set?.thresholds.some((threshold) => {
      const index = indexes.get(threshold.skillId)
      return index !== undefined && values[index] < caps[index] &&
        (setCounts.get(set.id) ?? 0) < threshold.pieces
    })
    return gain(values, armorVector(armor)) + charmLookahead(nextValues) - charmLookahead(values) - (excessLevels(nextValues) - excessLevels(values)) -
      (extraExcess(addRawSkills(rawSkills, armor.skills)) - extraExcess(rawSkills)) +
      armor.slots.reduce((sum, slot) => sum + gain(nextValues, maxDecoration[slot.size]) * 0.2 + slot.size * 0.01, 0) +
      (usefulSet ? 0.5 : 0)
  }
  // Keep three representatives per equivalent constraint state, enough for three alternatives.
  function representatives<T>(entries: T[], key: (entry: T) => string): T[] {
    const counts = new Map<string, number>()
    return entries.filter((entry) => {
      const signature = key(entry)
      const count = counts.get(signature) ?? 0
      counts.set(signature, count + 1)
      return count < 3
    })
  }
  const groups = armorSlots.map((slot) => representatives(
    database.armors.filter((armor) => armor.rank === request.rank && armor.slot === slot &&
      (!request.excludeFatalis || !isFatalisArmor(armor)) &&
      (!fixedArmor[slot] || armor.id === fixedArmor[slot]),
    )
      .sort((a, b) => equipmentScore(b) - equipmentScore(a) || a.id.localeCompare(b.id)),
    (armor) => `${skillSignature(armor.skills)}|${armor.slots.map((slot) => slot.size).sort().join(',')}|${armor.setBonusId ?? armor.name.replace(/\s+[αβ](?:\+)?$/u, '')}`,
  )).sort((a, b) => a.length - b.length ||
    Math.max(...b.map((armor) => score(armorVector(armor)))) - Math.max(...a.map((armor) => score(armorVector(armor)))))
  if (groups.some((group) => !group.length)) return finish()
  const charms: (Charm | null)[] = representatives(
    database.charms.filter((charm) => vector(charm.skills).some((value) => value > 0) ||
      charm.skills.some((entry) => definitions.get(entry.skillId)?.unlocksSkillId || entry.skillId === 'inheritance'))
      .sort((a, b) => score(vector(b.skills)) - score(vector(a.skills)) ||
      excessLevels(vector(a.skills)) - excessLevels(vector(b.skills)) || a.id.localeCompare(b.id)),
    (charm) => skillSignature(charm.skills),
  )
  charms.push(null)
  const charmMax = ids.map((_, index) => Math.max(0, ...charms.map((charm) => vector(charm?.skills ?? [])[index])))
  const groupMax = groups.map((group) => ids.map((_, index) => Math.max(...group.map((armor) => vector(armor.skills)[index]))))
  skillWeights = caps.map((cap, index) => 1 / (cap * Math.max(1, groupMax.filter((values) => values[index] > 0).length)))
  const charmVectors = [...new Map(charms.map((charm) => {
    const values = vector(charm?.skills ?? [])
    return [signature(values), values] as const
  })).values()]
  const charmGainCache = new Map<string, number>()
  charmLookahead = (values) => {
    const key = signature(values)
    let best = charmGainCache.get(key)
    if (best === undefined) {
      best = Math.max(...charmVectors.map((added) => gain(values, added)))
      if (charmGainCache.size < 20_000) charmGainCache.set(key, best)
    }
    return best
  }
  const groupSlots = groups.map((group) => Array.from({ length: 5 }, (_, size) =>
    Math.max(...group.map((armor) => armor.slots.filter((slot) => slot.size === size).length)),
  ))
  const groupSets = groups.map((group) => new Set(group.map((armor) => armor.setBonusId)))
  const suffixSkills = Array.from({ length: 6 }, empty)
  const suffixSlots = Array.from({ length: 6 }, () => Array(5).fill(0) as number[])
  for (let index = 4; index >= 0; index--) {
    suffixSkills[index] = add(groupMax[index], suffixSkills[index + 1])
    suffixSlots[index] = add(groupSlots[index], suffixSlots[index + 1])
  }
  const weaponValues = vector(weapon?.skills ?? [])
  const weaponSlots = Array.from({ length: 5 }, (_, size) => (weapon?.slots ?? []).filter((slot) => slot.size === size).length)
  const possible = (depth: number, values: number[], slots: number[], setCounts: Map<string, number>) => {
    let upper = add(add(values, suffixSkills[depth]), charmMax)
    const capacities = add(slots, suffixSlots[depth])
    const sizes = [4, 3, 2, 1].flatMap((size) => Array(capacities[size]).fill(size) as number[]).slice(0, jewelBudget)
    for (const size of sizes) upper = add(upper, maxDecoration[size])
    let bonusUpper = empty()
    for (const set of relevantSets) {
      const pieces = (setCounts.get(set.id) ?? 0) + groupSets.slice(depth).filter((group) => group.has(set.id)).length
      bonusUpper = add(bonusUpper, vector(set.thresholds.filter((threshold) => threshold.pieces <= pieces).map((threshold) => ({ skillId: threshold.skillId, level: 1 }))))
    }
    if (!meets(add(upper, bonusUpper))) return false
    // Coordinate maxima alone can combine skill points that no single piece
    // supplies together. Bound the total useful gain as well.
    const base = add(values, bonusUpper)
    const requestedGain = (added: number[]) => added.reduce((sum, value, index) =>
      sum + (required.has(ids[index]) ? Math.min(value, Math.max(0, caps[index] - base[index])) : 0), 0)
    const needed = requestedGain(caps)
    const armorGain = groups.slice(depth).reduce((sum, group) => sum + Math.max(...group.map((armor) => requestedGain(armorVector(armor)))), 0)
    const charmGain = Math.max(...charms.map((charm) => requestedGain(vector(charm?.skills ?? []))))
    const jewelGain = sizes.reduce((sum, size) => sum + Math.max(0, ...decorations
      .filter((entry) => entry.decoration.slotSize <= size).map((entry) => requestedGain(entry.values))), 0)
    return needed <= armorGain + charmGain + jewelGain
  }
  const initialSetCounts = new Map<string, number>()
  if (weapon?.setBonusId) initialSetCounts.set(weapon.setBonusId, 1)

  const failedDecorationStates = new Set<string>()
  function fillDecorations(initialValues: number[], slots: SearchSlot[], initialRaw: Record<string, number>): EquippedDecoration[] | null {
    // Increasing budgets prove the minimum for this armor/charm combination.
    // Skipping a small slot is essential: one large jewel may replace two small ones.
    for (let budget = 0; budget <= Math.min(jewelBudget, slots.length); budget++) {
      let best: EquippedDecoration[] | null = null
      let bestWaste = Infinity
      const floor = excessLevels(initialValues) + extraExcess(initialRaw)
      function solve(values: number[], raw: Record<string, number>, index: number, left: number, equipped: EquippedDecoration[]): boolean {
        if (!visit()) return false
        if (exceedsCap(raw)) return false
        if (excessLevels(values) + extraExcess(raw) > bestWaste) return false
        if (meets(values)) {
          if (exceedsCap(raw, true)) return false
          const waste = excessLevels(values) + extraExcess(raw, true)
          if (waste < bestWaste) { best = equipped; bestWaste = waste }
          return waste === floor
        }
        if (!left || index === slots.length) return false
        let upper = [...values]
        for (const slot of slots.slice(index).slice(-left)) upper = add(upper, maxDecoration[slot.size])
        if (!meets(upper)) return false
        const rawSignature = Object.entries(raw).sort(([a], [b]) => a.localeCompare(b)).map(([id, level]) => `${id}:${level}`).join(',')
        const key = `${signature(values)}|${rawSignature}|${slots.slice(index).map((slot) => slot.size).join(',')}|${left}`
        if (failedDecorationStates.has(key)) return false
        const slot = slots[index]
        const candidates = decorations.filter((entry) => entry.decoration.slotSize <= slot.size &&
          entry.values.some((value, i) => value > 0 && values[i] < caps[i]))
          .sort((a, b) => {
            const waste = (entry: typeof a) => excessLevels(add(values, entry.values)) + extraExcess(addRawSkills(raw, entry.decoration.skills), true)
            return waste(a) - waste(b) || gain(values, b.values) - gain(values, a.values) || a.decoration.id.localeCompare(b.decoration.id)
          })
        const previousBest = best
        for (const entry of candidates) {
          if (solve(add(values, entry.values), addRawSkills(raw, entry.decoration.skills), index + 1, left - 1,
            [...equipped, { decoration: entry.decoration, location: slot.location }])) return true
          if (stopped()) return false
        }
        if (solve(values, raw, index + 1, left, equipped)) return true
        // Only cache true infeasibility, never a branch rejected by an incumbent.
        if (!stopped() && best === null && previousBest === null && bestWaste === Infinity && failedDecorationStates.size < 50_000) failedDecorationStates.add(key)
        return false
      }
      solve(initialValues, initialRaw, 0, budget, [])
      if (best || stopped()) return best
    }
    return null
  }

  // Search and refinement share validation, decoration solving and provenance.
  function evaluateBuild(pieces: ArmorPiece[], charm: Charm | null): RankedBuild | null {
    if (!visit()) return null
    const bonusSkills = getActiveSetBonusSkills(calculateSetBonuses(pieces, weapon ?? null, database.setBonuses))
    const sources = [weapon?.skills ?? [], ...pieces.map((piece) => piece.skills), charm?.skills ?? [], bonusSkills]
    const rawWithBonuses = sources.reduce((totals, skills) => addRawSkills(totals, skills), {} as Record<string, number>)
    if (exceedsCap(rawWithBonuses)) return null
    const baseValues = sources.reduce((totals, skills) => add(totals, vector(skills)), empty())
    const slots: SearchSlot[] = [
      ...(weapon?.slots ?? []).map((slot, slotIndex) => ({ size: slot.size, location: { type: 'weapon' as const, slotIndex } })),
      ...pieces.flatMap((armor) => armor.slots.map((slot, slotIndex) => ({ size: slot.size, location: { type: 'armor' as const, slot: armor.slot, slotIndex } }))),
    ].sort((a, b) => a.size - b.size)
    let upper = [...baseValues]
    for (const slot of slots.slice(slots.length - Math.min(jewelBudget, slots.length))) upper = add(upper, maxDecoration[slot.size])
    if (!meets(upper)) return null
    const equipped = fillDecorations(baseValues, slots, rawWithBonuses)
    if (!equipped) return null
  const stats = calculateBuildStats(pieces, weapon ?? null, [
    weapon?.skills ?? [], ...pieces.map((armor) => armor.skills), charm?.skills ?? [],
    ...equipped.map((entry) => entry.decoration.skills),
  ], database.skills, database.setBonuses)
  if ([...required].some(([id, level]) => (stats.skills[id]?.level ?? 0) < level)) {
    throw new Error('Generated build failed skill validation.')
  }
  const armorCombination = armorSlots
    .map((slot) => pieces.find((piece) => piece.slot === slot)!.id)
    .join('|')
  const armorLayout = armorSlots.map((slot) => {
    const armor = pieces.find((piece) => piece.slot === slot)!
    const family = armor.setBonusId ?? armor.name.replace(/\s+[αβ](?:\+)?$/u, '')
    return `${slot}:${family}`
  })
  const candidate = { build: serializeBuild({
    selectedArmor: Object.fromEntries(pieces.map((armor) => [armor.slot, armor])),
    selectedWeapon: weapon ?? null, selectedCharm: charm, decorations: equipped,
  }), skills: stats.skills,
    requiredSkillSources: Object.fromEntries([...required.keys()].map((id) => {
      const points = (source: ArmorSkill[]) => source.reduce((sum, entry) => sum + (entry.skillId === id ? entry.level : 0), 0)
      return [id, {
        armor: pieces.reduce((sum, piece) => sum + points(piece.skills), 0), charm: points(charm?.skills ?? []),
        setBonus: points(bonusSkills), decorations: equipped.reduce((sum, entry) => sum + points(entry.decoration.skills), 0),
        weapon: points(weapon?.skills ?? []),
      }]
    })),
  }
  const finalValues = equipped.reduce((totals, entry) => add(totals, vector(entry.decoration.skills)),
    baseValues)
  const finalRawSkills = equipped.reduce((totals, entry) => addRawSkills(totals, entry.decoration.skills), rawWithBonuses)
  const excess = excessLevels(finalValues) + extraExcess(finalRawSkills, true)
  const decorationCount = equipped.length
  const freeSlotScore = slots.reduce((sum, slot) => sum + slot.size ** 2, 0) -
    equipped.reduce((sum, entry) => sum + slots.find((slot) => slot.location === entry.location)!.size ** 2, 0)
  return { layout: armorLayout, combination: armorCombination, build: candidate, excess, decorationCount, freeSlotScore }
  }

  function searchArmor(depth: number, values: number[], slotCounts: number[], setCounts: Map<string, number>, pieces: ArmorPiece[], rawSkills: Record<string, number>) {
    if (phaseStopped) return
    if (exceedsCap(rawSkills)) return
    if (worstRetained?.decorationCount === 0 && excessLevels(values) + extraExcess(rawSkills) > worstRetained.excess) return
    if (!visit() || !possible(depth, values, slotCounts, setCounts)) return
    const candidatesBeforeBranch = phaseCandidates
    const nodesBeforeBranch = visitedNodes
    if (depth === 5) {
      const orderedCharms = charms.map((charm) => ({ charm, values: vector(charm?.skills ?? []) }))
        .sort((a, b) => gain(values, b.values) - gain(values, a.values) ||
          excessLevels(add(values, a.values)) - excessLevels(add(values, b.values)))
      for (const { charm } of orderedCharms) {
        const ranked = evaluateBuild(pieces, charm)
        if (!ranked) { if (stopped()) return; continue }
        const { combination: armorCombination, layout: armorLayout } = ranked
        const candidateKey = limits.distinctArmorLayouts ? armorLayout.join('|') : armorCombination
        const previous = rankedBuilds.get(candidateKey)
        if (!previous || compareBuilds(ranked, previous) < 0) {
          rankedBuilds.set(candidateKey, ranked)
          phaseLayouts.add(armorLayout.join('|'))
          phaseCandidates = phaseLayouts.size
          worstRetained = [...rankedBuilds.values()].sort(compareBuilds)[2]
        }
        if (rankedBuilds.size > maxLayoutCandidates * 2) {
          const retained = [...rankedBuilds.values()].sort(compareBuilds).slice(0, maxLayoutCandidates)
          rankedBuilds.clear()
          for (const entry of retained) rankedBuilds.set(limits.distinctArmorLayouts ? entry.layout.join('|') : entry.combination, entry)
          sampled = true
        }
      }
      return
    }
    // Score remaining needs and the best possible charm contribution together.
    // A piece gains no merit for replacing points a charm can already supply.
    const candidates = groups[depth].map((armor) => ({ armor, score: equipmentScore(armor, values, setCounts, rawSkills) }))
      .sort((a, b) => b.score - a.score || a.armor.id.localeCompare(b.armor.id))
    for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
      const { armor } = candidates[candidateIndex]
      const nextSlots = [...slotCounts]
      for (const slot of armor.slots) nextSlots[slot.size]++
      const nextSets = new Map(setCounts)
      if (armor.setBonusId) nextSets.set(armor.setBonusId, (nextSets.get(armor.setBonusId) ?? 0) + 1)
      searchArmor(depth + 1, add(values, armorVector(armor)), nextSlots, nextSets, [...pieces, armor], addRawSkills(rawSkills, armor.skills))
      if (limited || phaseStopped) return
      if (candidateIndex + 1 === candidates.length) continue
      if (phaseCandidates >= maxLayoutCandidates) { sampled = true; return }
      // Share each phase across early armor choices even when a branch finds
      // no solution; otherwise the first base can consume the whole budget.
      const branchingDepth = groups.slice(0, depth).filter((group) => group.length > 1).length
      if (visitedNodes - nodesBeforeBranch >= Math.max(64, Math.floor(phaseNodeBudget / 3 ** branchingDepth))) { sampled = true; return }
      // Reserve candidate space for earlier slots instead of filling the pool
      // with leg swaps under the first four armor pieces.
      if (phaseCandidates - candidatesBeforeBranch >= Math.max(1, Math.floor(maxLayoutCandidates / 3 ** depth))) { sampled = true; return }
    }
  }
  const maxJewels = suffixSlots[0].reduce((sum, count) => sum + count, 0) + weaponSlots.reduce((sum, count) => sum + count, 0)
  for (jewelBudget = 0; jewelBudget <= maxJewels; jewelBudget++) {
    phaseCandidates = 0
    phaseLayouts.clear()
    phaseStartNodes = visitedNodes
    phaseStopped = false
    searchArmor(0, weaponValues, weaponSlots, initialSetCounts, [], addRawSkills({}, weapon?.skills ?? []))
    const alternatives = new Set([...rankedBuilds.values()].map((entry) => entry.layout.join('|')))
    if (limited || searchStopped || alternatives.size >= 3) break
  }
  // An unavoidable overlap must not make an otherwise feasible request fail.
  // Retry without the cap preference only if the clean search found nothing.
  if (!rankedBuilds.size && !limited && !searchStopped) {
    allowOverflow = true
    failedDecorationStates.clear()
    for (jewelBudget = 0; jewelBudget <= maxJewels; jewelBudget++) {
      phaseCandidates = 0
      phaseLayouts.clear()
      phaseStartNodes = visitedNodes
      phaseStopped = false
      searchArmor(0, weaponValues, weaponSlots, initialSetCounts, [], addRawSkills({}, weapon?.skills ?? []))
      if (limited || searchStopped || rankedBuilds.size >= 3) break
    }
  }
  if (limits.refine !== false && rankedBuilds.size && !limited) refineCandidates()
  return finish()
}

/**
 * Searches one weapon class at the selected progression rank, returning valid
 * alternatives with distinct weapons. Rarity is the catalog's rank proxy:
 * Low 1–4, High 5–8, and Master 9–12.
 */
export function generateBuildsForWeaponType(
  request: BuildGeneratorRequest,
  database: GeneratorDatabase,
  limits: SearchLimits = {},
): BuildGeneratorResult {
  const started = performance.now()
  const maxNodes = limits.maxNodes ?? 200_000
  const maxTimeMs = limits.maxTimeMs ?? 10_000
  const rarityByRank: Record<ArmorPiece['rank'], [number, number]> = {
    low: [1, 4],
    high: [5, 8],
    master: [9, 12],
  }
  const ranks = Object.keys(rarityByRank)
  const types: WeaponType[] = [
    'great-sword', 'long-sword', 'sword-and-shield', 'dual-blades', 'hammer',
    'hunting-horn', 'lance', 'gunlance', 'switch-axe', 'charge-blade',
    'insect-glaive', 'light-bowgun', 'heavy-bowgun', 'bow',
  ]
  if (!ranks.includes(request.rank) || !types.includes(request.weaponType) || !request.skills.length) {
    throw new Error('Choose a weapon type, armor rank and at least one required skill.')
  }
  const fixedArmor = validateFixedArmor(request.fixedArmor, request.rank, database, request.excludeFatalis)

  const [minRarity, maxRarity] = rarityByRank[request.rank]
  const candidates = database.weapons.filter((weapon) =>
    weapon.type === request.weaponType && weapon.rarity >= minRarity && weapon.rarity <= maxRarity,
  )
  const builds: BuildGeneratorResult['builds'] = []
  const weaponsById = new Map(database.weapons.map((weapon) => [weapon.id, weapon]))
  const getWeaponFamily = (weapon: Weapon) => {
    let current = weapon
    const visited = new Set<string>()
    while (current.previousWeaponId && !visited.has(current.id)) {
      visited.add(current.id)
      const previous = weaponsById.get(current.previousWeaponId)
      if (!previous) break
      current = previous
    }
    return current.id
  }
  let visitedNodes = 0
  let searchWasLimited = false
  let optimizationComplete = true
  const successfulFamilies = new Set<string>()
  const fallbackCandidates: Weapon[] = []
  const attemptedWeapons = new Set<string>()

  const searchWeapon = (weapon: Weapon) => {
    const remainingNodes = maxNodes - visitedNodes
    const remainingTime = maxTimeMs - (performance.now() - started)
    if (remainingNodes <= 0 || remainingTime <= 0) {
      searchWasLimited = true
      return null
    }

    attemptedWeapons.add(weapon.id)
    const result = generateBuilds(
      { weaponId: weapon.id, rank: request.rank, skills: request.skills, fixedArmor, excludeFatalis: request.excludeFatalis },
      database,
      { maxNodes: remainingNodes, maxTimeMs: remainingTime },
    )
    visitedNodes += result.visitedNodes
    searchWasLimited ||= result.status === 'limit'
    optimizationComplete &&= result.optimizationComplete === true
    return result
  }

  for (const weapon of candidates) {
    const family = getWeaponFamily(weapon)
    if (successfulFamilies.has(family)) {
      fallbackCandidates.push(weapon)
      continue
    }

    const result = searchWeapon(weapon)
    if (!result) break

    if (result.builds.length) {
      builds.push(result.builds[0])
      successfulFamilies.add(family)
    }
    if (successfulFamilies.size === 3) break
  }

  // Prefer different weapon-tree lines; use other eligible weapons only when
  // the requested skills leave fewer than three valid lines.
  if (builds.length < 3 && !searchWasLimited) {
    for (const weapon of fallbackCandidates) {
      if (attemptedWeapons.has(weapon.id)) continue
      const result = searchWeapon(weapon)
      if (!result) break
      if (result.builds.length) builds.push(result.builds[0])
      if (builds.length === 3) break
    }
  }

  return {
    builds,
    status: searchWasLimited ? 'limit' : builds.length === 3 ? 'found' : 'exhausted',
    optimizationComplete: optimizationComplete && !searchWasLimited && attemptedWeapons.size === candidates.length,
    visitedNodes,
    elapsedMs: performance.now() - started,
  }
}

/** Armor, charm and decorations satisfy every requirement without weapon contributions. */
export function generateArmorBuilds(
  request: Omit<BuildGeneratorRequest, 'weaponType'>,
  database: GeneratorDatabase,
  limits: SearchLimits = {},
): BuildGeneratorResult {
  return generateBuilds({ ...request, weaponId: null }, database, { ...limits, distinctArmorLayouts: true })
}
