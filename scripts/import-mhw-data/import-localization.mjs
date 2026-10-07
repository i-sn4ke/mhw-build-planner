import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readCsv } from './utils.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const source = path.resolve(root, '../MHWorldData/source_data')
const catalogs = [
  ['weapons', 'weapons', 'weapon_base_translations.csv'],
  ['armor', 'armors', 'armor_base_translations.csv'],
  ['charms', 'charms', 'charm_base_translations.csv'],
  ['decorations', 'decorations', 'decoration_base_translations.csv'],
  ['skills', 'skills', 'skill_base_translations.csv'],
  ['setBonuses', 'armors', 'armorset_bonus_base_translations.csv'],
]
const output = {}
for (const [catalog, directory, filename] of catalogs) {
  const key = (row) => catalog === 'weapons'
    ? `${row.weapon_type ?? row.type}::${row.name_en ?? row.name}` : row.name_en ?? row.name
  const translations = new Map(readCsv(path.join(source, directory), filename).map((row) => [key(row), row]))
  const entries = JSON.parse(fs.readFileSync(path.join(root, `src/data/generated/${catalog}.json`), 'utf8'))
  output[catalog] = Object.fromEntries(entries.flatMap((entry) => {
    const row = translations.get(key(entry))
    if (!row?.name_it.trim()) return []
    return [[entry.id, { name: row.name_it, ...(row.description_it?.trim() ? { description: row.description_it } : {}) }]]
  }))
}
const skills = JSON.parse(fs.readFileSync(path.join(root, 'src/data/generated/skills.json'), 'utf8'))
const skillsByName = new Map(skills.map((entry) => [entry.name, entry]))
for (const row of readCsv(path.join(source, 'skills'), 'skill_levels.csv')) {
  const skill = skillsByName.get(row.base_name_en)
  if (skill && output.skills[skill.id] && row.description_it.trim()) {
    const translated = output.skills[skill.id]
    translated.levels ??= {}
    translated.levels[row.level] = row.description_it
  }
}
const monsters = readCsv(path.join(source, 'monsters'), 'monster_base_translations.csv')
const damage = JSON.parse(fs.readFileSync(path.join(root, 'src/data/generated/damageSimulation.json'), 'utf8'))
output.monsters = Object.fromEntries(damage.monsters.flatMap((monster) => {
  const row = monsters.find((entry) => entry.name_en === monster.name)
  return row?.name_it.trim() ? [[monster.id, { name: row.name_it }]] : []
}))
const destination = path.join(root, 'src/i18n/generated/it.json')
fs.mkdirSync(path.dirname(destination), { recursive: true })
fs.writeFileSync(destination, `${JSON.stringify(output, null, 2)}\n`)
for (const [catalog, entries] of Object.entries(output)) console.log(`${catalog}: ${Object.keys(entries).length} Italian translations`)
