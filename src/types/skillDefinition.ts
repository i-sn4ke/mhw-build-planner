export interface SkillLevelDefinition {
  level: number
  description: string
}

export interface SkillDefinition {
  id: string
  name: string
  description: string

  maxLevel: number
  levels: SkillLevelDefinition[]

  iconColor?: string

  secret?: number
  unlocksSkillId?: string
}