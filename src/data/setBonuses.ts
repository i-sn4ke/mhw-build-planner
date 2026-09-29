import type { SetBonusDefinition } from '../types/setBonus'

export const testSetBonuses: SetBonusDefinition[] = [
  {
    id: 'fatalis-legend',
    name: 'Fatalis Legend',
    thresholds: [
      {
        pieces: 2,
        skillId: 'Inheritance',
      },
      {
        pieces: 4,
        skillId: 'Transcendence',
      },
    ],
  },
  {
    id: 'teostra-technique',
    name: 'Teostra Technique',
    thresholds: [
      {
        pieces: 2,
        skillId: "Master's Touch",
      },
      {
        pieces: 4,
        skillId: 'True Mastery',
      },
    ],
  },
]