import type { SetBonusDefinition } from '../types/setBonus'

export const testSetBonuses: SetBonusDefinition[] = [
  {
    id: 'fatalis-legend',
    name: 'Fatalis Legend',
    thresholds: [
      {
        pieces: 2,
        name: 'Inheritance',
      },
      {
        pieces: 4,
        name: 'Transcendence',
      },
    ],
  },
  {
    id: 'teostra-technique',
    name: 'Teostra Technique',
    thresholds: [
      {
        pieces: 2,
        name: "Master's Touch",
      },
      {
        pieces: 4,
        name: 'True Mastery',
      },
    ],
  },
]