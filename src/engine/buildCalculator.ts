import type { ArmorPiece, Weapon } from '../types/armor'
import type { ArmorSkill } from '../types/skill'
import type { SkillDefinition } from '../types/skillDefinition'
import type { SetBonusDefinition } from '../types/setBonus'
import { calculateSkillTotals } from './skills'
import type { CalculatedSkills } from '../types/calculatedSkill'
import {
  calculateSetBonuses,
  getActiveSetBonusSkills,
} from './setBonuses'

export interface BuildStats {
  defense: number
  resistances: {
    fire: number
    water: number
    thunder: number
    ice: number
    dragon: number
  }
}

export function calculateArmorStats(
  armorPieces: ArmorPiece[],
): BuildStats {
  return armorPieces.reduce(
    (stats, armor) => ({
      defense: stats.defense + armor.defense.base,

      resistances: {
        fire:
          stats.resistances.fire +
          armor.resistances.fire,

        water:
          stats.resistances.water +
          armor.resistances.water,

        thunder:
          stats.resistances.thunder +
          armor.resistances.thunder,

        ice:
          stats.resistances.ice +
          armor.resistances.ice,

        dragon:
          stats.resistances.dragon +
          armor.resistances.dragon,
      },
    }),
    {
      defense: 0,
      resistances: {
        fire: 0,
        water: 0,
        thunder: 0,
        ice: 0,
        dragon: 0,
      },
    },
  )
}

export function calculateWeaponStats(
  weapon: Weapon | null,
) {
  return {
    attack: weapon?.attack ?? 0,
    affinity: weapon?.affinity ?? 0,
  }
}

export interface CalculatedBuildStats {
  defense: number

  resistances: {
    fire: number
    water: number
    thunder: number
    ice: number
    dragon: number
  }

  attack: number
  affinity: number

  skills: CalculatedSkills
}

export function calculateBuildStats(
  armorPieces: ArmorPiece[],
  weapon: Weapon | null,
  skillSources: ArmorSkill[][],
  skillDefinitions: SkillDefinition[],
  setBonusDefinitions: SetBonusDefinition[],
): CalculatedBuildStats {
  const armorStats = calculateArmorStats(armorPieces)
  const weaponStats = calculateWeaponStats(weapon)

  const activeSetBonuses = calculateSetBonuses(
    armorPieces,
    weapon,
    setBonusDefinitions,
  )

  const setBonusSkills =
    getActiveSetBonusSkills(activeSetBonuses)

  const skills = calculateSkillTotals(
    [
      ...skillSources,
      setBonusSkills,
    ],
    skillDefinitions,
  )

  return {
    defense: armorStats.defense,
    resistances: armorStats.resistances,
    attack: weaponStats.attack,
    affinity: weaponStats.affinity,
    skills,
  }
}