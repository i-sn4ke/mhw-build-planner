export interface SkillSimulationConditions {
  monsterEnraged: boolean
  target: 'normal' | 'weak' | 'wounded-weak'
  health: 'normal' | 'full' | 'recoverable'
  maximumMightActive: boolean
  latentPowerActive: boolean
  drawAttack: boolean
}

export interface SkillContribution {
  skillId: string
  level: number
  active: boolean
  rawAttack: number
  affinity: number
}

export interface SimulatedOffense {
  attack: number
  affinity: number
  uncappedAffinity: number
  rawAttackBonus: number
  affinityBonus: number
  contributions: SkillContribution[]
}
