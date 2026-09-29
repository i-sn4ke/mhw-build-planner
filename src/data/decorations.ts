import type { Decoration } from '../types/decoration'

export const testDecorations: Decoration[] = [
  {
    id: 'attack-jewel-1',
    name: 'Attack Jewel 1',
    slotSize: 1,
    skills: [
      {
        skillId: 'attack-boost',
        level: 1,
      },
    ],
  },

  {
    id: 'expert-jewel-1',
    name: 'Expert Jewel 1',
    slotSize: 1,
    skills: [
      {
        skillId: 'critical-eye',
        level: 1,
      },
    ],
  },

  {
    id: 'attack-jewel-4',
    name: 'Attack Jewel 4',
    slotSize: 4,
    skills: [
      {
        skillId: 'attack-boost',
        level: 2,
      },
    ],
  },
]