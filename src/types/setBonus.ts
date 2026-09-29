export interface SetBonusThreshold {
  pieces: number
  skillId: string
}

export interface SetBonusDefinition {
  id: string
  name: string
  thresholds: SetBonusThreshold[]
}