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
  '../MHWorldData/source_data/charms',
)

const outputPath = path.resolve(
  projectRoot,
  'src/data/generated/charms.json',
)

const baseCharms = readCsv(
  sourceDir,
  'charm_base.csv',
)

const charms = baseCharms.map((charm) => {
  const skills = []

  if (charm.skill1_name) {
    skills.push({
      skillId: createId(charm.skill1_name),
      level: Number(charm.skill1_level),
    })
  }

  if (charm.skill2_name) {
    skills.push({
      skillId: createId(charm.skill2_name),
      level: Number(charm.skill2_level),
    })
  }

  return {
    id: createId(charm.name_en),
    name: charm.name_en,
    rarity: Number(charm.rarity),
    skills,
    ...(charm.previous_en
      ? {
          previousCharmId: createId(charm.previous_en),
        }
      : {}),
  }
})

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true,
})

fs.writeFileSync(
  outputPath,
  `${JSON.stringify(charms, null, 2)}\n`,
  'utf8',
)

console.log(`Imported ${charms.length} charms.`)
console.log(`Output: ${outputPath}`)