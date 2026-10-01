import type { ArmorPiece, Weapon } from '../types/armor'
import type { ArmorSkill } from '../types/skill'
import type {
  SetBonusDefinition,
  SetBonusThreshold,
} from '../types/setBonus'

export interface ActiveSetBonus {
  id: string
  name: string
  pieces: number
  thresholds: SetBonusThreshold[]
}

export function calculateSetBonuses(
  armorPieces: ArmorPiece[],
  weapon: Weapon | null,
  setBonuses: SetBonusDefinition[],
): ActiveSetBonus[] {
  return setBonuses
    .map((setBonus) => {
      const armorPiecesCount = armorPieces.filter(
        (armor) => armor.setBonusId === setBonus.id,
      ).length

      const weaponPiecesCount =
        weapon?.setBonusId === setBonus.id ? 1 : 0

      const pieces =
        armorPiecesCount + weaponPiecesCount

      if (pieces === 0) {
        return null
      }

      return {
        id: setBonus.id,
        name: setBonus.name,
        pieces,
        thresholds: setBonus.thresholds,
      }
    })
    .filter(
      (setBonus): setBonus is ActiveSetBonus =>
        setBonus !== null,
    )
}

export function getActiveSetBonusSkills(
  activeSetBonuses: ActiveSetBonus[],
): ArmorSkill[] {
  return activeSetBonuses.flatMap((setBonus) =>
    setBonus.thresholds
      .filter(
        (threshold) =>
          setBonus.pieces >= threshold.pieces,
      )
      .map((threshold) => ({
        skillId: threshold.skillId,
        level: 1,
      })),
  )
}