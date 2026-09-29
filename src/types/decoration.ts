import type { ArmorSkill } from './skill'

export interface Decoration {
  id: string
  name: string
  slotSize: number
  rarity: number
  skills: ArmorSkill[]
}