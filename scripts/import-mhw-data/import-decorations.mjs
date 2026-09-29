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
  '../MHWorldData/source_data/decorations',
)

const outputPath = path.resolve(
  projectRoot,
  'src/data/generated/decorations.json',
)

const baseDecorations = readCsv(sourceDir, 'decoration_base.csv')

const decorations = baseDecorations.map((decoration) => {
  const skills = []

  if (decoration.skill1_name) {
    skills.push({
      skillId: createId(decoration.skill1_name),
      level: Number(decoration.skill1_level),
    })
  }

  if (decoration.skill2_name) {
    skills.push({
      skillId: createId(decoration.skill2_name),
      level: Number(decoration.skill2_level),
    })
  }

  return {
    id: createId(decoration.name_en),
    name: decoration.name_en,
    slotSize: Number(decoration.slot),
    rarity: Number(decoration.rarity),
    skills,
  }
})

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true,
})

fs.writeFileSync(
  outputPath,
  `${JSON.stringify(decorations, null, 2)}\n`,
  'utf8',
)

console.log(
  `Imported ${decorations.length} decorations.`,
)
console.log(`Output: ${outputPath}`)