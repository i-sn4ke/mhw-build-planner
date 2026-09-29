import type { ArmorSkill } from './skill'

export interface Charm {
  id: string
  name: string
  rarity: number
  skills: ArmorSkill[]
  previousCharmId?: string
}