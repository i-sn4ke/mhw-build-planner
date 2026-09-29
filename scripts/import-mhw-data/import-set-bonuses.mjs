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
  'src/data/generated/setBonuses.json',
)

const baseSetBonuses = readCsv(
  sourceDir,
  'armorset_bonus_base.csv',
)

const setBonuses = baseSetBonuses.map((setBonus) => {
  const thresholds = []

  if (setBonus.skill1_name) {
    thresholds.push({
      pieces: Number(setBonus.skill1_required),
      skillId: createId(setBonus.skill1_name),
    })
  }

  if (setBonus.skill2_name) {
    thresholds.push({
      pieces: Number(setBonus.skill2_required),
      skillId: createId(setBonus.skill2_name),
    })
  }

  thresholds.sort((a, b) => a.pieces - b.pieces)

  return {
    id: createId(setBonus.name_en),
    name: setBonus.name_en,
    thresholds,
  }
})

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true,
})

fs.writeFileSync(
  outputPath,
  `${JSON.stringify(setBonuses, null, 2)}\n`,
  'utf8',
)

console.log(
  `Imported ${setBonuses.length} set bonuses.`,
)
console.log(`Output: ${outputPath}`)