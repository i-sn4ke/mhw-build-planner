import type { SetBonusDefinition } from '../types/setBonus'
import generatedSetBonuses from './generated/setBonuses.json'

export const setBonuses: SetBonusDefinition[] =
  generatedSetBonuses as SetBonusDefinition[]