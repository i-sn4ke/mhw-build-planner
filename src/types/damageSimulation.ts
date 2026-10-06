export type DamageElement = 'fire' | 'water' | 'thunder' | 'ice' | 'dragon'
export type SharpnessColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'white' | 'purple'
export type SpiritLevel = 'none' | 'white' | 'yellow' | 'red'

export interface DamagePart {
  id: string
  name: string
  sever: number
  elements: Record<DamageElement, number>
}
export interface DamageMonster {
  id: string
  name: string
  source: string
  enrageMultiplier: number
  parts: DamagePart[]
}
export interface LongSwordAttack {
  id: string
  name: string
  motionValue: number
  elementMultiplier: number
  drawEligible: boolean
}
export interface DamageScenario {
  sharpness: SharpnessColor
  spirit: SpiritLevel
  wounded: boolean
  sweetspot: boolean
}
export interface HitDamage {
  physical: number
  elemental: number
  total: number
}
export interface LongSwordDamage {
  normal: HitDamage
  critical: HitDamage
  feeble: HitDamage
  average: HitDamage
  affinity: number
  trueRaw: number
  element: DamageElement | null
  trueElement: number
  effectiveSever: number
  weakSpot: boolean
}
