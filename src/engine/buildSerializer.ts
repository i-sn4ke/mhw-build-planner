import type {
  ArmorPiece,
  ArmorSlot,
  Weapon,
} from '../types/armor'
import type { Charm } from '../types/charm'
import type { Decoration } from '../types/decoration'
import type { EquippedDecoration } from '../types/equipment'
import type { SavedBuildData } from '../types/savedBuild'

interface BuildToSerialize {
  selectedArmor: Partial<Record<ArmorSlot, ArmorPiece>>
  selectedWeapon: Weapon | null
  selectedCharm: Charm | null
  decorations: EquippedDecoration[]
}

interface BuildDatabase {
  armors: ArmorPiece[]
  weapons: Weapon[]
  charms: Charm[]
  decorations: Decoration[]
}

export interface DeserializedBuild {
  selectedArmor: Partial<Record<ArmorSlot, ArmorPiece>>
  selectedWeapon: Weapon | null
  selectedCharm: Charm | null
  decorations: EquippedDecoration[]
}

export function serializeBuild(
  build: BuildToSerialize,
): SavedBuildData {
  const armor: Partial<Record<ArmorSlot, string>> = {}

  for (const [slot, armorPiece] of Object.entries(
    build.selectedArmor,
  )) {
    if (!armorPiece) {
      continue
    }

    armor[slot as ArmorSlot] = armorPiece.id
  }

  return {
    version: 1,

    weaponId: build.selectedWeapon?.id ?? null,

    armor,

    charmId: build.selectedCharm?.id ?? null,

    decorations: build.decorations.map((equipped) => ({
      decorationId: equipped.decoration.id,
      location: equipped.location,
    })),
  }
}

export function deserializeBuild(
  savedBuild: SavedBuildData,
  database: BuildDatabase,
): DeserializedBuild {
  if (savedBuild.version !== 1) {
    throw new Error(
      `Unsupported build version: ${savedBuild.version}`,
    )
  }

  const armorById = new Map(
    database.armors.map((armor) => [
      armor.id,
      armor,
    ]),
  )

  const weaponsById = new Map(
    database.weapons.map((weapon) => [
      weapon.id,
      weapon,
    ]),
  )

  const charmsById = new Map(
    database.charms.map((charm) => [
      charm.id,
      charm,
    ]),
  )

  const decorationsById = new Map(
    database.decorations.map((decoration) => [
      decoration.id,
      decoration,
    ]),
  )

  const selectedArmor: Partial<
    Record<ArmorSlot, ArmorPiece>
  > = {}

  for (const [slot, armorId] of Object.entries(
    savedBuild.armor,
  )) {
    if (!armorId) {
      continue
    }

    const armorPiece = armorById.get(armorId)

    if (!armorPiece) {
      continue
    }

    selectedArmor[slot as ArmorSlot] = armorPiece
  }

  const selectedWeapon = savedBuild.weaponId
    ? weaponsById.get(savedBuild.weaponId) ?? null
    : null

  const selectedCharm = savedBuild.charmId
    ? charmsById.get(savedBuild.charmId) ?? null
    : null

  const decorations: EquippedDecoration[] = []

  for (const savedDecoration of savedBuild.decorations) {
    const decoration = decorationsById.get(
      savedDecoration.decorationId,
    )

    if (!decoration) {
      continue
    }

    if (savedDecoration.location.type === 'armor') {
      const armorPiece =
        selectedArmor[savedDecoration.location.slot]

      if (!armorPiece) {
        continue
      }

      const targetSlot =
        armorPiece.slots[
          savedDecoration.location.slotIndex
        ]

      if (
        !targetSlot ||
        decoration.slotSize > targetSlot.size
      ) {
        continue
      }
    }

    if (savedDecoration.location.type === 'weapon') {
      if (!selectedWeapon) {
        continue
      }

      const targetSlot =
        selectedWeapon.slots[
          savedDecoration.location.slotIndex
        ]

      if (
        !targetSlot ||
        decoration.slotSize > targetSlot.size
      ) {
        continue
      }
    }

    decorations.push({
      decoration,
      location: savedDecoration.location,
    })
  }

  return {
    selectedArmor,
    selectedWeapon,
    selectedCharm,
    decorations,
  }
}