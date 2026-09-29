import type { ArmorPiece } from '../types/armor'

export const testArmors: ArmorPiece[] = [
  {
    id: 'kaiser-crown-beta-plus',
    name: 'Kaiser Crown β+',
    slot: 'head',
    rank: 'master',
    rarity: 12,
    defense: {
      base: 114,
      max: 114,
      augmentMax: 114,
    },

    resistances: {
      fire: 3,
      water: -2,
      thunder: 1,
      ice: -3,
      dragon: 2,
    },

    skills: [
      {
        skillId: 'critical-eye',
        level: 2,
      },
    ],

    slots: [
      { size: 4 },
      { size: 1 },
    ],
  },

  {
    id: 'fatalis-helm-beta-plus',
    name: 'Fatalis Helm β+',
    setBonusId: 'fatalis-legend',
    slot: 'head',
    rank: 'master',
    rarity: 12,
    defense: {
      base: 150,
      max: 150,
      augmentMax: 150,
    },

    resistances: {
      fire: -1,
      water: 0,
      thunder: 0,
      ice: 0,
      dragon: -3,
    },

    skills: [
      {
        skillId: 'critical-eye',
        level: 1,
      },
    ],

    slots: [
      { size: 4 },
      { size: 4 },
    ],
  },

  {
    id: 'dragonhead-beta-plus',
    name: 'Dragonhead β+',
    slot: 'head',
    rank: 'master',
    rarity: 12,
    defense: {
      base: 150,
      max: 150,
      augmentMax: 150,
    },

    resistances: {
      fire: -2,
      water: 1,
      thunder: 1,
      ice: 1,
      dragon: -3,
    },

    skills: [
      {
        skillId: 'attack-boost',
        level: 2,
      },
    ],

    slots: [
      { size: 4 },
      { size: 4 },
      { size: 1 },
    ],
  },
  {
    id: 'test-chest',
    name: 'Test Chest β+',
    setBonusId: 'fatalis-legend',
    slot: 'chest',
    rank: 'master',
    rarity: 12,
    defense: {
      base: 120,
      max: 120,
      augmentMax: 120,
    },
    resistances: {
      fire: 2,
      water: 0,
      thunder: -1,
      ice: 1,
      dragon: -2,
    },
    skills: [
      {
        skillId: 'attack-boost',
        level: 1,
      },
    ],
    slots: [
      { size: 4 },
      { size: 2 },
    ],
  },

  {
    id: 'test-arms',
    name: 'Test Arms β+',
    setBonusId: 'teostra-technique',
    slot: 'arms',
    rank: 'master',
    rarity: 12,
    defense: {
      base: 118,
      max: 118,
      augmentMax: 118,
    },
    resistances: {
      fire: 1,
      water: -1,
      thunder: 2,
      ice: 0,
      dragon: -2,
    },
    skills: [
      {
        skillId: 'critical-eye',
        level: 1,
      },
    ],
    slots: [
      { size: 4 },
    ],
  },

  {
    id: 'test-waist',
    name: 'Test Waist β+',
    setBonusId: 'teostra-technique',
    slot: 'waist',
    rank: 'master',
    rarity: 12,
    defense: {
      base: 116,
      max: 116,
      augmentMax: 116,
    },
    resistances: {
      fire: 0,
      water: 2,
      thunder: -2,
      ice: 1,
      dragon: -1,
    },
    skills: [],
    slots: [
      { size: 4 },
      { size: 1 },
    ],
  },

  {
    id: 'test-legs',
    name: 'Test Legs β+',
    slot: 'legs',
    rank: 'master',
    rarity: 12,
    defense: {
      base: 122,
      max: 122,
      augmentMax: 122,
    },
    resistances: {
      fire: -1,
      water: 1,
      thunder: 0,
      ice: -2,
      dragon: 2,
    },
    skills: [
      {
        skillId: 'attack-boost',
        level: 1,
      },
    ],
    slots: [
      { size: 4 },
      { size: 4 },
    ],
  },
]