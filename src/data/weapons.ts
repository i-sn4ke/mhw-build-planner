import type { Weapon } from '../types/armor'

export const testWeapons: Weapon[] = [
  {
    id: 'test-great-sword',
    name: 'Test Great Sword',
    type: 'great-sword',
    rarity: 10,

    attack: 1200,
    affinity: 10,

    elements: [],

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
    type: 'long-sword',
    rarity: 10,

    attack: 700,
    affinity: 15,

    elements: [],

    slots: [
      { size: 4 },
    ],

    skills: [],
  },
]