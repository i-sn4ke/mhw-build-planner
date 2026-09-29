import type { ArmorSlot } from './armor'
import type { DecorationLocation } from './equipment'

export interface SavedDecoration {
  decorationId: string
  location: DecorationLocation
}

export interface SavedBuildData {
  version: 1

  weaponId: string | null

  armor: Partial<Record<ArmorSlot, string>>

  charmId: string | null

  decorations: SavedDecoration[]
}

export interface SavedBuild {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  build: SavedBuildData
}