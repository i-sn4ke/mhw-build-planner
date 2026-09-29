import type { Charm } from '../types/charm'

export const testCharms: Charm[] = [
  {
    id: 'attack-charm-v',
    name: 'Attack Charm V',
    skills: [
      {
        skillId: 'attack-boost',
        level: 3,
      },
    ],
    slots: [
      { size: 4 },
    ],
  },
  {
    id: 'critical-eye-charm-v',
    name: 'Critical Eye Charm V',
    skills: [
      {
        skillId: 'critical-eye',
        level: 3,
      },
    ],
    slots: [
      { size: 2 },
      { size: 1 },
    ],
  },
  {
    id: 'test-charm',
    name: 'Test Charm',
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
    slots: [
      { size: 4 },
      { size: 2 },
    ],
  },
]