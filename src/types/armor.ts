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

  defense: number

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

export interface Weapon {
  id: string
  name: string
  type: string

  attack: number
  affinity: number

  slots: EquipmentSlot[]

  skills: ArmorSkill[]
}