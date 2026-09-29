import { create } from 'zustand'
import type {
  ArmorPiece,
  ArmorSlot,
  Weapon,
} from '../types/armor'
import type { EquippedDecoration } from '../types/equipment'
import type { Charm } from '../types/charm'

interface BuildState {
  selectedArmor: Partial<Record<ArmorSlot, ArmorPiece>>
  selectedWeapon: Weapon | null
  decorations: EquippedDecoration[]
  selectedCharm: Charm | null

  setArmor: (armor: ArmorPiece) => void
  setWeapon: (weapon: Weapon | null) => void
  addDecoration: (
    decoration: EquippedDecoration,
  ) => void
  setCharm: (charm: Charm | null) => void
  clearCharm: () => void
  removeDecoration: (
    location: EquippedDecoration['location'],
  ) => void
  clearArmor: (slot: ArmorSlot) => void
  clearWeapon: () => void
}

export const useBuildStore = create<BuildState>(
  (set) => ({
    selectedArmor: {},
    selectedWeapon: null,
    decorations: [],
    selectedCharm: null,

    setArmor: (armor) =>
      set((state) => ({
        selectedArmor: {
          ...state.selectedArmor,
          [armor.slot]: armor,
        },
        decorations: state.decorations.filter(
          (equipped) => {
            if (equipped.location.type !== 'armor') {
              return true
            }

            return equipped.location.slot !== armor.slot
          },
        ),
      })),

    setWeapon: (weapon) =>
      set((state) => ({
        selectedWeapon: weapon,
        decorations: state.decorations.filter(
          (equipped) =>
            equipped.location.type !== 'weapon',
        ),
      })),

    addDecoration: (decoration) =>
      set((state) => {
        const filteredDecorations =
          state.decorations.filter((equipped) => {
            if (
              equipped.location.type !==
              decoration.location.type
            ) {
              return true
            }

            if (
              equipped.location.type === 'armor' &&
              decoration.location.type === 'armor'
            ) {
              return !(
                equipped.location.slot ===
                  decoration.location.slot &&
                equipped.location.slotIndex ===
                  decoration.location.slotIndex
              )
            }

            if (
              equipped.location.type === 'weapon' &&
              decoration.location.type === 'weapon'
            ) {
              return (
                equipped.location.slotIndex !==
                decoration.location.slotIndex
              )
            }

            return true
          })

        return {
          decorations: [
            ...filteredDecorations,
            decoration,
          ],
        }
      }),

    setCharm: (charm) =>
      set({
        selectedCharm: charm,
      }),

    clearCharm: () =>
      set({
        selectedCharm: null,
      }),

    removeDecoration: (location) =>
      set((state) => ({
        decorations: state.decorations.filter(
          (equipped) => {
            if (
              equipped.location.type !== location.type
            ) {
              return true
            }

            if (
              equipped.location.type === 'armor' &&
              location.type === 'armor'
            ) {
              return !(
                equipped.location.slot ===
                  location.slot &&
                equipped.location.slotIndex ===
                  location.slotIndex
              )
            }

            if (
              equipped.location.type === 'weapon' &&
              location.type === 'weapon'
            ) {
              return (
                equipped.location.slotIndex !==
                location.slotIndex
              )
            }

            return true
          },
        ),
      })),

    clearArmor: (slot) =>
      set((state) => {
        const updatedArmor = {
          ...state.selectedArmor,
        }

        delete updatedArmor[slot]

        return {
          selectedArmor: updatedArmor,
          decorations: state.decorations.filter(
            (equipped) =>
              equipped.location.type !== 'armor' ||
              equipped.location.slot !== slot,
          ),
        }
      }),

    clearWeapon: () =>
      set((state) => ({
        selectedWeapon: null,
        decorations: state.decorations.filter(
          (equipped) =>
            equipped.location.type !== 'weapon',
        ),
      })),
  }),
)