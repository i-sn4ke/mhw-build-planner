export interface SetBonusThreshold {
  pieces: number
  name: string
}

export interface SetBonusDefinition {
  id: string
  name: string
  thresholds: SetBonusThreshold[]
}