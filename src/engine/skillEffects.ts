import type { Weapon, WeaponType } from '../types/armor'
import type { CalculatedSkills } from '../types/calculatedSkill'
import type { SkillSimulationConditions, SimulatedOffense, SkillContribution } from '../types/skillSimulation'

// MHWorldData/mhdata/cfg.py: weapon_multiplier. The imported attack is rounded display attack.
export const weaponAttackMultipliers: Record<WeaponType, number> = {
  'great-sword': 4.8, 'long-sword': 3.3, 'sword-and-shield': 1.4,
  'dual-blades': 1.4, hammer: 5.2, 'hunting-horn': 4.2,
  lance: 2.3, gunlance: 2.3, 'switch-axe': 3.5, 'charge-blade': 3.6,
  'insect-glaive': 3.1, 'light-bowgun': 1.3, 'heavy-bowgun': 1.5, bow: 1.2,
}

// Values match the level descriptions in src/data/generated/skills.json (Iceborne).
// Flat attack bonuses are true raw; no damage or critical-damage multiplier is simulated.
const effects: Record<string, { attack: number[]; affinity: number[] }> = {
  'attack-boost': { attack: [0, 3, 6, 9, 12, 15, 18, 21], affinity: [0, 0, 0, 0, 5, 5, 5, 5] },
  'critical-eye': { attack: [], affinity: [0, 5, 10, 15, 20, 25, 30, 40] },
  agitator: { attack: [0, 4, 8, 12, 16, 20, 24, 28], affinity: [0, 5, 5, 7, 7, 10, 15, 20] },
  'weakness-exploit': { attack: [], affinity: [0, 10, 15, 30] },
  'peak-performance': { attack: [0, 5, 10, 20], affinity: [] },
  resentment: { attack: [0, 5, 10, 15, 20, 25], affinity: [] },
  'maximum-might': { attack: [], affinity: [0, 10, 20, 30, 40, 40] },
  'latent-power': { attack: [], affinity: [0, 10, 20, 30, 40, 50, 50, 60] },
  'critical-draw': { attack: [], affinity: [0, 30, 60, 100] },
}

export const supportedOffensiveSkills = new Set(Object.keys(effects))

export function defaultSimulationConditions(): SkillSimulationConditions {
  return {
    monsterEnraged: false, target: 'normal', health: 'normal',
    maximumMightActive: false, latentPowerActive: false, drawAttack: false,
  }
}

export function simulateOffensiveSkills(
  weapon: Weapon | null,
  skills: CalculatedSkills,
  conditions: SkillSimulationConditions,
): SimulatedOffense {
  const contributions: SkillContribution[] = []
  if (!weapon) return { attack: 0, affinity: 0, uncappedAffinity: 0, rawAttackBonus: 0, affinityBonus: 0, contributions }
  const active: Record<string, boolean> = {
    'attack-boost': true,
    'critical-eye': true,
    agitator: conditions.monsterEnraged,
    'weakness-exploit': conditions.target !== 'normal',
    'peak-performance': conditions.health === 'full',
    resentment: conditions.health === 'recoverable',
    'maximum-might': conditions.maximumMightActive,
    'latent-power': conditions.latentPowerActive,
    'critical-draw': conditions.drawAttack,
  }
  for (const [skillId, effect] of Object.entries(effects)) {
    // Use the effective level from the existing cap/Secret/Inheritance engine.
    const level = skills[skillId]?.level ?? 0
    if (level <= 0) continue
    const woundedBonus = skillId === 'weakness-exploit' && conditions.target === 'wounded-weak' ? [0, 5, 15, 20][level] ?? 0 : 0
    contributions.push({
      skillId, level, active: active[skillId],
      rawAttack: effect.attack[level] ?? 0,
      affinity: (effect.affinity[level] ?? 0) + woundedBonus,
    })
  }
  const rawAttackBonus = contributions.reduce((sum, entry) => sum + (entry.active ? entry.rawAttack : 0), 0)
  const affinityBonus = contributions.reduce((sum, entry) => sum + (entry.active ? entry.affinity : 0), 0)
  const multiplier = weaponAttackMultipliers[weapon.type]
  // All catalog values round-trip through an integer true raw with these multipliers.
  const multiplierTenths = Math.round(multiplier * 10)
  const baseRaw = Math.round(weapon.attack * 10 / multiplierTenths)
  const uncappedAffinity = weapon.affinity + affinityBonus
  return {
    // Integer multiplication first avoids floating-point errors at x.5 rounding boundaries.
    attack: rawAttackBonus ? Math.round((baseRaw + rawAttackBonus) * multiplierTenths / 10) : weapon.attack,
    affinity: Math.max(-100, Math.min(100, uncappedAffinity)),
    uncappedAffinity, rawAttackBonus, affinityBonus, contributions,
  }
}
