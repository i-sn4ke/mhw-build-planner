import type { Charm } from '../types/charm'

export const testCharms: Charm[] = [
  {
    id: 'attack-charm-v',
    name: 'Attack Charm V',
    rarity: 12,
    skills: [
      {
        skillId: 'attack-boost',
        level: 3,
      },
    ],
  },
  {
    id: 'critical-eye-charm-v',
    name: 'Critical Eye Charm V',
    rarity: 12,
    skills: [
      {
        skillId: 'critical-eye',
        level: 3,
      },
    ],
  },
  {
    id: 'test-charm',
    name: 'Test Charm',
    rarity: 10,
    skills: [
      {
        skillId: 'attack-boost',
        level: 1,
      },
      {
        skillId: 'critical-eye',
        level: 1,
      },
    ],
  },
]