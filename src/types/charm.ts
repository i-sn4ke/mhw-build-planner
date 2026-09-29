import type { ArmorSkill } from './skill'
import type { EquipmentSlot } from './slot'

export interface Charm {
  id: string
  name: string

  skills: ArmorSkill[]
  slots: EquipmentSlot[]
}