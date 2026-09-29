import type { ArmorPiece } from '../types/armor'
import type { SetBonusDefinition } from '../types/setBonus'

export interface ActiveSetBonus {
  id: string
  name: string
  pieces: number
  thresholds: {
    pieces: number
    name: string
  }[]
}

export function calculateSetBonuses(
  armorPieces: ArmorPiece[],
  setBonuses: SetBonusDefinition[],
): ActiveSetBonus[] {
  return setBonuses
    .map((setBonus) => {
      const pieces = armorPieces.filter(
        (armor) => armor.setBonusId === setBonus.id,
      ).length

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