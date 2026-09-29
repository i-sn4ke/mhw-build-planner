import type { ArmorSkill } from './skill'
import type { EquipmentSlot } from './slot'

export type ArmorSlot =
  | 'head'
  | 'chest'
  | 'arms'
  | 'waist'
  | 'legs'

export interface ArmorPiece {
  id: string
  name: string
  setBonusId?: string
  slot: ArmorSlot

  rank: 'low' | 'high' | 'master'
  rarity: number

  defense: {
    base: number
    max: number
    augmentMax: number
  }

  resistances: {
    fire: number
    water: number
    thunder: number
    ice: number
    dragon: number
  }

  skills: ArmorSkill[]

  slots: EquipmentSlot[]
}

export type WeaponType =
  | 'great-sword'
  | 'long-sword'
  | 'sword-and-shield'
  | 'dual-blades'
  | 'hammer'
  | 'hunting-horn'
  | 'lance'
  | 'gunlance'
  | 'switch-axe'
  | 'charge-blade'
  | 'insect-glaive'
  | 'light-bowgun'
  | 'heavy-bowgun'
  | 'bow'

export interface WeaponElement {
  type: string
  damage: number
  hidden: boolean
}

export interface Weapon {
  id: string
  name: string
  type: WeaponType

  rarity: number

  attack: number
  affinity: number
  defenseBonus?: number

  elements: WeaponElement[]

  slots: EquipmentSlot[]
  skills: ArmorSkill[]

  previousWeaponId?: string

  kinsectBonus?: string
  phial?: string
  phialPower?: number
  shelling?: string
  shellingLevel?: number

  notes?: string
}