import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mhw-engine-test-'))
const modules = ['buildGenerator', 'buildCalculator', 'skills', 'setBonuses', 'buildSerializer', 'weaponFilters', 'equipmentFilters', 'skillEffects']
for (const name of modules) {
  const source = fs.readFileSync(path.join(root, 'src', 'engine', `${name}.ts`), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } }).outputText
    .replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'")
  fs.writeFileSync(path.join(directory, `${name}.mjs`), compiled)
}

export const { generateBuilds } = await import(pathToFileURL(path.join(directory, 'buildGenerator.mjs')))
export const { calculateBuildStats } = await import(pathToFileURL(path.join(directory, 'buildCalculator.mjs')))
export const { deserializeBuild, serializeBuild } = await import(pathToFileURL(path.join(directory, 'buildSerializer.mjs')))
export const { matchesWeaponElement } = await import(pathToFileURL(path.join(directory, 'weaponFilters.mjs')))
export const { matchesEquipmentSearch } = await import(pathToFileURL(path.join(directory, 'equipmentFilters.mjs')))
export const { simulateOffensiveSkills, defaultSimulationConditions, weaponAttackMultipliers, supportedOffensiveSkills } = await import(pathToFileURL(path.join(directory, 'skillEffects.mjs')))
// The temporary compiled modules are all imported before removing this directory.
if (path.dirname(directory) !== path.resolve(os.tmpdir()) || !path.basename(directory).startsWith('mhw-engine-test-')) {
  throw new Error('Unexpected temporary test directory')
}
fs.rmSync(directory, { recursive: true, force: true })

export function catalog() {
  return Object.fromEntries(['armor', 'weapons', 'charms', 'decorations', 'skills', 'setBonuses'].map((name) => [
    name === 'armor' ? 'armors' : name,
    JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'generated', `${name}.json`), 'utf8')),
  ]))
}
