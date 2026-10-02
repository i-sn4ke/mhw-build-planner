import type { ArmorPiece, ArmorSlot, Weapon } from '../types/armor'
import type { Charm } from '../types/charm'
import type { Decoration } from '../types/decoration'
import type { ArmorSkill } from '../types/skill'
import type { SkillDefinition } from '../types/skillDefinition'
import type { SetBonusDefinition } from '../types/setBonus'
import type { EquippedDecoration, DecorationLocation } from '../types/equipment'
import type { BuildGeneratorRequest, BuildGeneratorResult } from '../types/buildGenerator'
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
}

interface SearchSlot {
  size: number
  location: DecorationLocation
}

const armorSlots: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']

/** Bounded search for up to three valid builds, without damage ranking. */
export function generateBuilds(
  request: BuildGeneratorRequest,
  database: GeneratorDatabase,
  limits: SearchLimits = {},
): BuildGeneratorResult {
  const started = performance.now()
  const maxNodes = limits.maxNodes ?? 200_000
  const maxTimeMs = limits.maxTimeMs ?? 10_000
  let visitedNodes = 0
  let limited = false
  const builds: BuildGeneratorResult['builds'] = []
  const weapon = database.weapons.find((entry) => entry.id === request.weaponId)
  const definitions = new Map(database.skills.map((entry) => [entry.id, entry]))
  if (!weapon || !['low', 'high', 'master'].includes(request.rank) || !request.skills.length) {
    throw new Error('Choose a weapon, armor rank and at least one required skill.')
  }
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
    if (limited || builds.length === 3) return false
    visitedNodes++
    if (visitedNodes > maxNodes || (visitedNodes % 256 === 0 && performance.now() - started >= maxTimeMs)) {
      limited = true
      return false
    }
    return true
  }
  const finish = (): BuildGeneratorResult => ({
    builds,
    status: builds.length === 3 ? 'found' : limited ? 'limit' : 'exhausted',
    visitedNodes,
    elapsedMs: performance.now() - started,
  })

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
    database.armors.filter((armor) => armor.rank === request.rank && armor.slot === slot)
      .sort((a, b) => equipmentScore(b) - equipmentScore(a) || a.id.localeCompare(b.id)),
    (armor) => `${signature(vector(armor.skills))}|${armor.slots.map((slot) => slot.size).sort().join(',')}|${relevantSetIds.has(armor.setBonusId ?? '') ? armor.setBonusId : ''}`,
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
  const weaponValues = vector(weapon.skills)
  const weaponSlots = Array.from({ length: 5 }, (_, size) => weapon.slots.filter((slot) => slot.size === size).length)
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
  if (weapon.setBonusId) initialSetCounts.set(weapon.setBonusId, 1)
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
    if (depth === 5) {
      const bonusSkills = getActiveSetBonusSkills(calculateSetBonuses(pieces, weapon!, database.setBonuses))
      const slots: SearchSlot[] = [
        ...weapon!.slots.map((slot, slotIndex) => ({ size: slot.size, location: { type: 'weapon' as const, slotIndex } })),
        ...pieces.flatMap((armor) => armor.slots.map((slot, slotIndex) => ({ size: slot.size, location: { type: 'armor' as const, slot: armor.slot, slotIndex } }))),
      ].sort((a, b) => a.size - b.size)
      const equipped = fillDecorations(add(values, vector(bonusSkills)), slots)
      if (!equipped) return
      const stats = calculateBuildStats(pieces, weapon!, [
        weapon!.skills, ...pieces.map((armor) => armor.skills), charm?.skills ?? [],
        ...equipped.map((entry) => entry.decoration.skills),
      ], database.skills, database.setBonuses)
      if ([...required].some(([id, level]) => (stats.skills[id]?.level ?? 0) < level)) {
        throw new Error('Generated build failed skill validation.')
      }
      builds.push({ build: serializeBuild({
        selectedArmor: Object.fromEntries(pieces.map((armor) => [armor.slot, armor])),
        selectedWeapon: weapon!, selectedCharm: charm, decorations: equipped,
      }), skills: stats.skills })
      return
    }
    for (const armor of groups[depth]) {
      const nextSlots = [...slotCounts]
      for (const slot of armor.slots) nextSlots[slot.size]++
      const nextSets = new Map(setCounts)
      if (armor.setBonusId) nextSets.set(armor.setBonusId, (nextSets.get(armor.setBonusId) ?? 0) + 1)
      searchArmor(depth + 1, add(values, vector(armor.skills)), nextSlots, nextSets, [...pieces, armor], charm)
      if (limited || builds.length === 3) return
    }
  }
  for (const charm of charms) {
    searchArmor(0, add(weaponValues, vector(charm?.skills ?? [])), weaponSlots, initialSetCounts, [], charm)
    if (limited || builds.length === 3) break
  }
  return finish()
}
