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
  '../MHWorldData/source_data/weapons',
)

const generatedDir = path.resolve(
  projectRoot,
  'src/data/generated',
)

const outputPath = path.resolve(
  generatedDir,
  'weapons.json',
)

const baseWeapons = readCsv(
  sourceDir,
  'weapon_base.csv',
)

const skills = JSON.parse(
  fs.readFileSync(
    path.join(generatedDir, 'skills.json'),
    'utf8',
  ),
)

const setBonuses = JSON.parse(
  fs.readFileSync(
    path.join(generatedDir, 'setBonuses.json'),
    'utf8',
  ),
)

const skillIds = new Set(
  skills.map((skill) => skill.id),
)

const setBonusIds = new Set(
  setBonuses.map((setBonus) => setBonus.id),
)

const validWeaponTypes = new Set([
  'great-sword',
  'long-sword',
  'sword-and-shield',
  'dual-blades',
  'hammer',
  'hunting-horn',
  'lance',
  'gunlance',
  'switch-axe',
  'charge-blade',
  'insect-glaive',
  'light-bowgun',
  'heavy-bowgun',
  'bow',
])

function createWeaponLookupKey(name, type) {
  return `${type}::${name}`
}

const weaponIdByNameAndType = new Map()

for (const weapon of baseWeapons) {
  const key = createWeaponLookupKey(
    weapon.name_en,
    weapon.weapon_type,
  )

  if (weaponIdByNameAndType.has(key)) {
    throw new Error(
      `Duplicate weapon lookup key "${key}".`,
    )
  }

  weaponIdByNameAndType.set(
    key,
    String(weapon.id),
  )
}

function createSlots(weapon) {
  return [
    weapon.slot_1,
    weapon.slot_2,
    weapon.slot_3,
  ]
    .map(Number)
    .filter((size) => size > 0)
    .map((size) => ({ size }))
}

function createElements(weapon) {
  const elements = []

  const hidden =
    weapon.element_hidden.toUpperCase() === 'TRUE'

  if (weapon.element1) {
    elements.push({
      type: weapon.element1,
      damage: Number(weapon.element1_attack),
      hidden,
    })
  }

  if (weapon.element2) {
    elements.push({
      type: weapon.element2,
      damage: Number(weapon.element2_attack),
      hidden,
    })
  }

  return elements
}

function resolveWeaponSkill(weapon) {
  if (!weapon.skill) {
    return {
      skills: [],
    }
  }

  const id = createId(weapon.skill)

  if (skillIds.has(id)) {
    return {
      skills: [
        {
          skillId: id,
          level: 1,
        },
      ],
    }
  }

  if (setBonusIds.has(id)) {
    return {
      skills: [],
      setBonusId: id,
    }
  }

  throw new Error(
    `Unknown weapon skill or set bonus "${weapon.skill}" on "${weapon.name_en}".`,
  )
}

function resolvePreviousWeaponId(weapon) {
  if (!weapon.previous_en) {
    return undefined
  }

  const key = createWeaponLookupKey(
    weapon.previous_en,
    weapon.weapon_type,
  )

  const previousWeaponId =
    weaponIdByNameAndType.get(key)

  if (!previousWeaponId) {
    throw new Error(
      `Previous weapon "${weapon.previous_en}" not found for "${weapon.name_en}".`,
    )
  }

  return previousWeaponId
}

const weapons = baseWeapons.map((weapon) => {
  if (!validWeaponTypes.has(weapon.weapon_type)) {
    throw new Error(
      `Unknown weapon type "${weapon.weapon_type}" on "${weapon.name_en}".`,
    )
  }

  const weaponSkill = resolveWeaponSkill(weapon)
  const previousWeaponId =
    resolvePreviousWeaponId(weapon)

  return {
    id: String(weapon.id),
    name: weapon.name_en,
    type: weapon.weapon_type,

    rarity: Number(weapon.rarity),

    attack: Number(weapon.attack),
    affinity: Number(weapon.affinity),

    ...(weapon.defense
      ? {
          defenseBonus: Number(weapon.defense),
        }
      : {}),

    elements: createElements(weapon),

    slots: createSlots(weapon),

    skills: weaponSkill.skills,

    ...(weaponSkill.setBonusId
      ? {
          setBonusId: weaponSkill.setBonusId,
        }
      : {}),

    ...(previousWeaponId
      ? {
          previousWeaponId,
        }
      : {}),

    ...(weapon.kinsect_bonus
      ? {
          kinsectBonus: weapon.kinsect_bonus,
        }
      : {}),

    ...(weapon.phial
      ? {
          phial: weapon.phial,
        }
      : {}),

    ...(weapon.phial_power
      ? {
          phialPower: Number(
            weapon.phial_power,
          ),
        }
      : {}),

    ...(weapon.shelling
      ? {
          shelling: weapon.shelling,
        }
      : {}),

    ...(weapon.shelling_level
      ? {
          shellingLevel: Number(
            weapon.shelling_level,
          ),
        }
      : {}),

    ...(weapon.notes
      ? {
          notes: weapon.notes,
        }
      : {}),
  }
})

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true,
})

fs.writeFileSync(
  outputPath,
  `${JSON.stringify(weapons, null, 2)}\n`,
  'utf8',
)

console.log(`Imported ${weapons.length} weapons.`)
console.log(`Output: ${outputPath}`)