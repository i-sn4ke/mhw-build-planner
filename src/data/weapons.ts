import type { Weapon } from '../types/armor'

export const testWeapons: Weapon[] = [
  {
    id: 'test-great-sword',
    name: 'Test Great Sword',
    type: 'Great Sword',
    attack: 1200,
    affinity: 10,
    slots: [
      { size: 4 },
      { size: 2 },
    ],
    skills: [
      {
        skillId: 'attack-boost',
        level: 2,
      },
    ],
  },
  {
    id: 'test-long-sword',
    name: 'Test Long Sword',
    type: 'Long Sword',
    attack: 700,
    affinity: 15,
    slots: [
      { size: 4 }
    ],
    skills: [],
  },
]