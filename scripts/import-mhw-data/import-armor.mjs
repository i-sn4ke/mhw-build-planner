import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createId,
  readCsv,
} from './utils.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '../..')

const sourceDir = path.resolve(
  projectRoot,
  '../MHWorldData/source_data/armors',
)

const outputPath = path.resolve(
  projectRoot,
  'src/data/generated/armor.json',
)

const baseArmor = readCsv(
  sourceDir,
  'armor_base.csv',
)

const armorSkills = readCsv(
  sourceDir,
  'armor_skills_ext.csv',
)

const armorSets = readCsv(
  sourceDir,
  'armorset_base.csv',
)

const skillsByArmorName = new Map(
  armorSkills.map((armor) => [
    armor.base_name_en,
    armor,
  ]),
)

const armorSetInfoByArmorName = new Map()

const armorSlots = [
  'head',
  'chest',
  'arms',
  'waist',
  'legs',
]

for (const armorSet of armorSets) {
  for (const slot of armorSlots) {
    const armorName = armorSet[slot]

    if (!armorName) {
      continue
    }

    armorSetInfoByArmorName.set(armorName, {
      rank: armorSet.rank,
      bonus: armorSet.bonus,
    })
  }
}

function normalizeRank(rank) {
  switch (rank) {
    case 'LR':
      return 'low'

    case 'HR':
      return 'high'

    case 'MR':
      return 'master'

    default:
      throw new Error(`Unknown armor rank: ${rank}`)
  }
}

function createSlots(armor) {
  return [
    armor.slot_1,
    armor.slot_2,
    armor.slot_3,
  ]
    .map(Number)
    .filter((size) => size > 0)
    .map((size) => ({ size }))
}

function createSkills(skillData) {
  if (!skillData) {
    return []
  }

  const skills = []

  if (skillData.skill1_name) {
    skills.push({
      skillId: createId(skillData.skill1_name),
      level: Number(skillData.skill1_level),
    })
  }

  if (skillData.skill2_name) {
    skills.push({
      skillId: createId(skillData.skill2_name),
      level: Number(skillData.skill2_level),
    })
  }

  return skills
}

const armor = baseArmor.map((basePiece) => {
  const setInfo = armorSetInfoByArmorName.get(
    basePiece.name_en,
  )

  if (!setInfo) {
    throw new Error(
      `Armor "${basePiece.name_en}" does not belong to an armor set.`,
    )
  }

  const skillData = skillsByArmorName.get(
    basePiece.name_en,
  )

  return {
    id: createId(basePiece.id),
    name: basePiece.id,

    ...(setInfo.bonus
      ? {
          setBonusId: createId(setInfo.bonus),
        }
      : {}),

    slot: basePiece.type,
    rank: normalizeRank(setInfo.rank),
    rarity: Number(basePiece.rarity),

    defense: {
      base: Number(basePiece.defense_base),
      max: Number(basePiece.defense_max),
      augmentMax: Number(
        basePiece.defense_augment_max,
      ),
    },

    resistances: {
      fire: Number(basePiece.defense_fire),
      water: Number(basePiece.defense_water),
      thunder: Number(
        basePiece.defense_thunder,
      ),
      ice: Number(basePiece.defense_ice),
      dragon: Number(basePiece.defense_dragon),
    },

    skills: createSkills(skillData),

    slots: createSlots(basePiece),
  }
})

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true,
})

fs.writeFileSync(
  outputPath,
  `${JSON.stringify(armor, null, 2)}\n`,
  'utf8',
)

console.log(`Imported ${armor.length} armor pieces.`)
console.log(`Output: ${outputPath}`)