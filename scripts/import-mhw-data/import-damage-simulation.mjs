import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createId, readCsv } from './utils.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const definitions = [
  ['Great Jagras', 'https://mhworld.kiranico.com/en/monsters/zJ1Sb/great-jagras'],
  ['Rathian', 'https://mhworld.kiranico.com/en/monsters/Rz9Tb/rathian'],
  ['Rathalos', 'https://mhworld.kiranico.com/en/monsters/BnetX/rathalos'],
]
const rows = readCsv(path.resolve(root, '../MHWorldData/source_data/monsters'), 'monster_hitzones.csv')
const numeric = (value) => {
  const number = Number(value)
  if (!value || !Number.isFinite(number) || number < 0) throw new Error(`Invalid numeric damage value: ${value}`)
  return number
}
const monsters = definitions.map(([name, source]) => {
  // Initial scope: ordinary, unbroken parts only. No inflated/broken/state variants.
  const parts = rows.filter((row) => row.base_name_en === name && !row.hitzone_en.includes('('))
    .map((row) => ({
      id: createId(row.hitzone_en), name: row.hitzone_en, sever: numeric(row.cut),
      elements: Object.fromEntries(['fire', 'water', 'thunder', 'ice', 'dragon'].map((element) => [element, numeric(row[element])])),
    }))
  if (!parts.length) throw new Error(`Missing hitzones for ${name}`)
  return { id: createId(name), name, source, enrageMultiplier: 1.1, parts }
})
const attacks = readCsv(path.resolve(root, 'scripts/import-mhw-data/sources'), 'long-sword-attacks.csv')
  .map((row) => ({ id: createId(row.name), name: row.name, motionValue: numeric(row.motionValue), elementMultiplier: numeric(row.elementMultiplier), drawEligible: row.name === 'Step Slash' }))
if (attacks.length !== 5) throw new Error('Expected the five verified basic Long Sword attacks')
const output = path.resolve(root, 'src/data/generated/damageSimulation.json')
fs.writeFileSync(output, `${JSON.stringify({ monsters, attacks }, null, 2)}\n`, 'utf8')
console.log(`Imported ${monsters.length} monsters and ${attacks.length} Long Sword attacks`)
