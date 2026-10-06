import type { Weapon } from '../types/armor'
import type { CalculatedSkills } from '../types/calculatedSkill'
import type { SkillSimulationConditions } from '../types/skillSimulation'
import type { DamageElement, DamageMonster, DamagePart, DamageScenario, HitDamage, LongSwordAttack, LongSwordDamage, SharpnessColor, SpiritLevel } from '../types/damageSimulation'
import { simulateOffensiveSkills, supportedOffensiveSkills } from './skillEffects'

// Deathcream & MoonBunnie, MHWI General Data Sheet / Damage Formula.
// Keep the Iceborne values: white elemental sharpness is 1.15 (not World's 1.125).
export const sharpnessMultipliers: Record<SharpnessColor, { physical: number; elemental: number }> = {
  red: { physical: .5, elemental: .25 }, orange: { physical: .75, elemental: .5 },
  yellow: { physical: 1, elemental: .75 }, green: { physical: 1.05, elemental: 1 },
  blue: { physical: 1.2, elemental: 1.0625 }, white: { physical: 1.32, elemental: 1.15 },
  purple: { physical: 1.39, elemental: 1.25 },
}
export const spiritMultipliers: Record<SpiritLevel, number> = { none: 1, white: 1.05, yellow: 1.1, red: 1.2 }
export const supportedDamageSkills = new Set([
  ...supportedOffensiveSkills, 'critical-boost', 'critical-element', 'true-critical-element',
  'non-elemental-boost', 'free-elem-ammo-up', 'fire-attack', 'water-attack', 'thunder-attack', 'ice-attack', 'dragon-attack',
])
const elements: DamageElement[] = ['fire', 'water', 'thunder', 'ice', 'dragon']
const level = (skills: CalculatedSkills, id: string) => skills[id]?.level ?? 0

// The game rounds positive damage below one up to one. Floating-point .5
// boundaries can vary in-game; this simulator uses deterministic half-up rounding.
const gameRound = (value: number) => value > 0 && value < 1 ? 1 : Math.round(value)

export function calculateLongSwordDamage(
  weapon: Weapon | null, skills: CalculatedSkills, conditions: SkillSimulationConditions,
  monster: DamageMonster, part: DamagePart, attack: LongSwordAttack, scenario: DamageScenario,
): LongSwordDamage | null {
  if (!weapon || weapon.type !== 'long-sword') return null
  const effectiveSever = scenario.wounded ? Math.floor(part.sever * .75) + 25 : part.sever
  const weakSpot = effectiveSever >= 45
  const offense = simulateOffensiveSkills(weapon, skills, {
    ...conditions, target: weakSpot ? (scenario.wounded ? 'wounded-weak' : 'weak') : 'normal',
    drawAttack: conditions.drawAttack && attack.drawEligible,
  })
  // Recover true raw from the catalog, not from rounded display attack after skills.
  const baseRaw = Math.round(weapon.attack / 3.3)
  const unlock = Math.min(3, level(skills, 'free-elem-ammo-up')) / 3
  const hasActiveAttribute = weapon.elements.some((entry) => !entry.hidden || unlock > 0)
  const nonElemental = !hasActiveAttribute && level(skills, 'non-elemental-boost') > 0 ? 1.05 : 1
  const trueRaw = gameRound(Math.min(baseRaw * nonElemental + offense.rawAttackBonus, baseRaw * 2) * spiritMultipliers[scenario.spirit])
  const attribute = weapon.elements.find((entry) => elements.includes(entry.type.toLowerCase() as DamageElement))
  const element = attribute ? attribute.type.toLowerCase() as DamageElement : null
  // Free Element unlocks the attribute; the original base still determines its cap.
  const baseElement = attribute ? attribute.damage / 10 : 0
  const activeElement = attribute ? (attribute.hidden ? baseElement * unlock : baseElement) : 0
  const elementLevel = element ? Math.min(6, level(skills, `${element}-attack`)) : 0
  const elementBonus = [0, 3, 6, 10, 10, 10, 10][elementLevel]
  const elementBoost = [1, 1, 1, 1, 1.05, 1.1, 1.2][elementLevel]
  const trueElement = activeElement > 0 ? Math.min(activeElement * elementBoost + elementBonus, Math.max(baseElement * 1.6, baseElement + 15)) : 0
  const criticalMultiplier = [1.25, 1.3, 1.35, 1.4][Math.min(3, level(skills, 'critical-boost'))]
  const elementCritical = level(skills, 'true-critical-element') > 0 ? 1.55 : level(skills, 'critical-element') > 0 ? 1.35 : 1
  const sharpness = sharpnessMultipliers[scenario.sharpness]
  const rage = conditions.monsterEnraged ? monster.enrageMultiplier : 1
  const physical = trueRaw * attack.motionValue / 100 * (scenario.sweetspot ? 1.03 : 1) * sharpness.physical * effectiveSever / 100 * rage
  const elemental = (critical: boolean) => gameRound(trueElement * (critical ? elementCritical : 1)) * attack.elementMultiplier * sharpness.elemental * (element ? part.elements[element] : 0) / 100 * rage
  const hit = (rawMultiplier: number, critical: boolean): HitDamage => {
    const raw = gameRound(physical * rawMultiplier)
    const ele = gameRound(elemental(critical))
    return { physical: raw, elemental: ele, total: raw + ele }
  }
  const normal = hit(1, false)
  const critical = hit(criticalMultiplier, true)
  const feeble = hit(.75, false)
  const chance = Math.abs(offense.affinity) / 100
  const affinityHit = offense.affinity < 0 ? feeble : critical
  const average = {
    physical: normal.physical * (1 - chance) + affinityHit.physical * chance,
    elemental: normal.elemental * (1 - chance) + affinityHit.elemental * chance,
    total: normal.total * (1 - chance) + affinityHit.total * chance,
  }
  return { normal, critical, feeble, average, affinity: offense.affinity, trueRaw, element, trueElement: gameRound(trueElement), effectiveSever, weakSpot }
}
