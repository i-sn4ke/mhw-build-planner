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
  '../MHWorldData/source_data/skills',
)

const outputPath = path.resolve(
  projectRoot,
  'src/data/generated/skills.json',
)

const baseSkills = readCsv(sourceDir, 'skill_base.csv')
const translations = readCsv(
  sourceDir,
  'skill_base_translations.csv',
)
const skillLevels = readCsv(sourceDir, 'skill_levels.csv')

const translationsByName = new Map(
  translations.map((translation) => [
    translation.name_en,
    translation,
  ]),
)

const levelsBySkill = new Map()

for (const level of skillLevels) {
  const existingLevels =
    levelsBySkill.get(level.base_name_en) ?? []

  existingLevels.push({
    level: Number(level.level),
    description: level.description_en,
  })

  levelsBySkill.set(level.base_name_en, existingLevels)
}

const skills = baseSkills.map((baseSkill) => {
  const translation = translationsByName.get(
    baseSkill.name_en,
  )

  const levels = (
    levelsBySkill.get(baseSkill.name_en) ?? []
  ).sort((a, b) => a.level - b.level)

  return {
    id: createId(baseSkill.name_en),
    name: baseSkill.name_en,
    description: translation?.description_en ?? '',
    maxLevel:
      levels.length > 0
        ? Math.max(...levels.map((level) => level.level))
        : 1,
    levels,
    ...(baseSkill.icon_color
      ? { iconColor: baseSkill.icon_color }
      : {}),
    ...(baseSkill.secret
      ? { secret: Number(baseSkill.secret) }
      : {}),
    ...(baseSkill.unlocks
      ? {
          unlocksSkillId: createId(baseSkill.unlocks),
        }
      : {}),
  }
})

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true,
})

fs.writeFileSync(
  outputPath,
  `${JSON.stringify(skills, null, 2)}\n`,
  'utf8',
)

console.log(`Imported ${skills.length} skills.`)
console.log(`Output: ${outputPath}`)