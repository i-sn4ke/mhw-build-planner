import type { ArmorSlot } from './armor'
import type { Decoration } from './decoration'

export type DecorationLocation =
  | {
      type: 'armor'
      slot: ArmorSlot
      slotIndex: number
    }
  | {
      type: 'weapon'
      slotIndex: number
    }

export interface EquippedDecoration {
  decoration: Decoration
  location: DecorationLocation
}