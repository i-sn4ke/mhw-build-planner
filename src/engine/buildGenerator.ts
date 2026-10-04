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
}

interface SearchSlot {
  size: number
  location: DecorationLocation
}

const armorSlots: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']
const maxLayoutCandidates = 48

function validateFixedArmor(
  requested: Partial<Record<ArmorSlot, string>> | undefined,
  rank: ArmorPiece['rank'],
  database: GeneratorDatabase,
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
  const layoutBuilds: { layout: string[]; build: BuildGeneratorResult['builds'][number] }[] = []
  const fallbackBuilds: BuildGeneratorResult['builds'] = []
  const seenArmorLayouts = new Set<string>()
  const seenArmorCombinations = new Set<string>()
  const weapon = request.weaponId === null ? null : database.weapons.find((entry) => entry.id === request.weaponId)
  const definitions = new Map(database.skills.map((entry) => [entry.id, entry]))
  if ((request.weaponId !== null && !weapon) || !['low', 'high', 'master'].includes(request.rank) || !request.skills.length) {
    throw new Error('Choose a weapon, armor rank and at least one required skill.')
  }
  const fixedArmor = validateFixedArmor(request.fixedArmor, request.rank, database)
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
  const visit = () => {
    if (limited || layoutBuilds.length >= maxLayoutCandidates) return false
    visitedNodes++
    if (visitedNodes > maxNodes || (visitedNodes % 256 === 0 && performance.now() - started >= maxTimeMs)) {
      limited = true
      return false
    }
    return true
  }
  const finish = (): BuildGeneratorResult => {
    const selected = layoutBuilds.length ? [layoutBuilds[0]] : []
    const remaining = layoutBuilds.slice(1)
    const distance = (a: string[], b: string[]) =>
      a.reduce((total, family, index) => total + Number(family !== b[index]), 0)

    while (selected.length < 3 && remaining.length) {
      let bestIndex = 0
      let bestDistance = -1
      for (let index = 0; index < remaining.length; index++) {
        const minDistance = Math.min(...selected.map((entry) => distance(entry.layout, remaining[index].layout)))
        if (minDistance > bestDistance) {
          bestDistance = minDistance
          bestIndex = index
        }
      }
      selected.push(remaining.splice(bestIndex, 1)[0])
    }

    const builds = [
      ...selected.map((entry) => entry.build),
      ...(limits.distinctArmorLayouts ? [] : fallbackBuilds.slice(0, 3 - selected.length)),
    ]

    return {
      builds,
      status: selected.length === 3 || (!limited && builds.length === 3)
        ? 'found' : limited ? 'limit' : 'exhausted',
      visitedNodes,
      elapsedMs: performance.now() - started,
    }
  }

  // Identical relevant skill vectors need only the smallest decoration slot.
  const decorationByVector = new Map<string, { decoration: Decoration; values: number[] }>()
  for (const decoration of database.decorations) {
    const values = vector(decoration.skills)
    if (!values.some((value) => value > 0)) continue
    const key = signature(values)
    const previous = decorationByVector.get(key)
    if (!previous || decoration.slotSize < previous.decoration.slotSize) {
      decorationByVector.set(key, { decoration, values })
    }
  }
  const decorations = [...decorationByVector.values()]
  const maxDecoration = Array.from({ length: 5 }, (_, size) => ids.map((_, index) =>
    Math.max(0, ...decorations.filter((entry) => entry.decoration.slotSize <= size).map((entry) => entry.values[index])),
  ))
  const relevantSets = database.setBonuses.filter((set) => set.thresholds.some((threshold) => indexes.has(threshold.skillId)))
  const relevantSetIds = new Set(relevantSets.map((set) => set.id))
  const score = (values: number[]) => values.reduce((sum, value, index) => sum + Math.min(value, caps[index]) / caps[index], 0)
  const equipmentScore = (armor: ArmorPiece) => score(vector(armor.skills)) +
    armor.slots.reduce((sum, slot) => sum + score(maxDecoration[slot.size]) * 0.2, 0) +
    (armor.setBonusId && relevantSetIds.has(armor.setBonusId) ? 1 : 0)
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
      (!fixedArmor[slot] || armor.id === fixedArmor[slot]),
    )
      .sort((a, b) => equipmentScore(b) - equipmentScore(a) || a.id.localeCompare(b.id)),
    (armor) => `${signature(vector(armor.skills))}|${armor.slots.map((slot) => slot.size).sort().join(',')}|${armor.setBonusId ?? armor.name.replace(/\s+[αβ](?:\+)?$/u, '')}`,
  ))
  if (groups.some((group) => !group.length)) return finish()
  const charms: (Charm | null)[] = representatives(
    [...database.charms].sort((a, b) => score(vector(b.skills)) - score(vector(a.skills)) || a.id.localeCompare(b.id)),
    (charm) => signature(vector(charm.skills)),
  )
  charms.push(null)
  const charmMax = ids.map((_, index) => Math.max(0, ...charms.map((charm) => vector(charm?.skills ?? [])[index])))
  const groupMax = groups.map((group) => ids.map((_, index) => Math.max(...group.map((armor) => vector(armor.skills)[index]))))
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
    let upper = add(values, suffixSkills[depth])
    const capacities = add(slots, suffixSlots[depth])
    for (let size = 1; size <= 4; size++) upper = add(upper, maxDecoration[size].map((value) => value * capacities[size]))
    for (const set of relevantSets) {
      const pieces = (setCounts.get(set.id) ?? 0) + groupSets.slice(depth).filter((group) => group.has(set.id)).length
      upper = add(upper, vector(set.thresholds.filter((threshold) => threshold.pieces <= pieces).map((threshold) => ({ skillId: threshold.skillId, level: 1 }))))
    }
    return meets(upper)
  }
  const initialSetCounts = new Map<string, number>()
  if (weapon?.setBonusId) initialSetCounts.set(weapon.setBonusId, 1)
  if (!possible(0, add(weaponValues, charmMax), weaponSlots, initialSetCounts)) return finish()

  const failedDecorationStates = new Set<string>()
  function fillDecorations(values: number[], slots: SearchSlot[], index = 0): EquippedDecoration[] | null {
    if (!visit()) return null
    if (meets(values)) return []
    if (index === slots.length) return null
    const key = `${signature(values)}|${slots.slice(index).map((slot) => slot.size).join(',')}`
    if (failedDecorationStates.has(key)) return null
    let upper = [...values]
    for (const slot of slots.slice(index)) upper = add(upper, maxDecoration[slot.size])
    if (!meets(upper)) return null
    const slot = slots[index]
    const candidates = decorations.filter((entry) => entry.decoration.slotSize <= slot.size &&
      entry.values.some((gain, i) => gain > 0 && values[i] < caps[i]),
    ).sort((a, b) => {
      const gain = (entry: typeof a) => entry.values.reduce((sum, value, i) => sum + Math.min(value, Math.max(0, caps[i] - values[i])) / caps[i], 0)
      return gain(b) - gain(a) || a.decoration.id.localeCompare(b.decoration.id)
    })
    for (const candidate of candidates) {
      const rest = fillDecorations(add(values, candidate.values), slots, index + 1)
      if (rest) return [{ decoration: candidate.decoration, location: slot.location }, ...rest]
      if (limited) return null
    }
    const withoutDecoration = fillDecorations(values, slots, index + 1)
    if (withoutDecoration) return withoutDecoration
    if (!limited && failedDecorationStates.size < 50_000) failedDecorationStates.add(key)
    return null
  }

  function searchArmor(depth: number, values: number[], slotCounts: number[], setCounts: Map<string, number>, pieces: ArmorPiece[], charm: Charm | null) {
    if (!visit() || !possible(depth, values, slotCounts, setCounts)) return
    const layoutsBeforeBranch = layoutBuilds.length
    if (depth === 5) {
      const bonusSkills = getActiveSetBonusSkills(calculateSetBonuses(pieces, weapon ?? null, database.setBonuses))
      const slots: SearchSlot[] = [
        ...(weapon?.slots ?? []).map((slot, slotIndex) => ({ size: slot.size, location: { type: 'weapon' as const, slotIndex } })),
        ...pieces.flatMap((armor) => armor.slots.map((slot, slotIndex) => ({ size: slot.size, location: { type: 'armor' as const, slot: armor.slot, slotIndex } }))),
      ].sort((a, b) => a.size - b.size)
      const equipped = fillDecorations(add(values, vector(bonusSkills)), slots)
      if (!equipped) return
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
      if (seenArmorCombinations.has(armorCombination)) return
      seenArmorCombinations.add(armorCombination)
      const armorLayout = armorSlots.map((slot) => {
        const armor = pieces.find((piece) => piece.slot === slot)!
        const family = armor.setBonusId ?? armor.name.replace(/\s+[αβ](?:\+)?$/u, '')
        return `${slot}:${family}`
      })
      const candidate = { build: serializeBuild({
        selectedArmor: Object.fromEntries(pieces.map((armor) => [armor.slot, armor])),
        selectedWeapon: weapon ?? null, selectedCharm: charm, decorations: equipped,
      }), skills: stats.skills }
      const layoutKey = armorLayout.join('|')
      if (seenArmorLayouts.has(layoutKey)) {
        if (fallbackBuilds.length < 3) fallbackBuilds.push(candidate)
        return
      }
      seenArmorLayouts.add(layoutKey)
      layoutBuilds.push({ layout: armorLayout, build: candidate })
      return
    }
    for (const armor of groups[depth]) {
      const nextSlots = [...slotCounts]
      for (const slot of armor.slots) nextSlots[slot.size]++
      const nextSets = new Map(setCounts)
      if (armor.setBonusId) nextSets.set(armor.setBonusId, (nextSets.get(armor.setBonusId) ?? 0) + 1)
      searchArmor(depth + 1, add(values, vector(armor.skills)), nextSlots, nextSets, [...pieces, armor], charm)
      if (limited || layoutBuilds.length >= maxLayoutCandidates) return
      // Reserve candidate space for earlier slots instead of filling the pool
      // with leg swaps under the first four armor pieces.
      if (limits.distinctArmorLayouts && layoutBuilds.length - layoutsBeforeBranch >= Math.max(3, Math.floor(maxLayoutCandidates / 2 ** depth))) return
    }
  }
  for (const charm of charms) {
    searchArmor(0, add(weaponValues, vector(charm?.skills ?? [])), weaponSlots, initialSetCounts, [], charm)
    if (limited || layoutBuilds.length >= maxLayoutCandidates) break
  }
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
  const fixedArmor = validateFixedArmor(request.fixedArmor, request.rank, database)

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
      { weaponId: weapon.id, rank: request.rank, skills: request.skills, fixedArmor },
      database,
      { maxNodes: remainingNodes, maxTimeMs: remainingTime },
    )
    visitedNodes += result.visitedNodes
    searchWasLimited ||= result.status === 'limit'
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
    status: builds.length === 3 ? 'found' : searchWasLimited ? 'limit' : 'exhausted',
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
