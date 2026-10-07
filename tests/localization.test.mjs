import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import { matchesEquipmentSearch } from './engineLoader.mjs'

const readJson = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'))
const italian = readJson('../src/i18n/generated/it.json')
const supplemental = readJson('../src/i18n/kiranico-it.json')
const overrides = readJson('../src/i18n/overrides-it.json')
for (const additions of [supplemental, overrides]) {
  for (const [category, entries] of Object.entries(additions)) {
    for (const [id, entry] of Object.entries(entries)) {
      italian[category][id] = { ...italian[category][id], ...entry }
    }
  }
}
const messages = readJson('../src/i18n/messages-it.json')
const source = fs.readFileSync(new URL('../src/i18n/translate.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { createTranslator, bilingualSearchText } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const catalogs = Object.fromEntries(['weapons', 'armor', 'charms', 'decorations', 'skills', 'setBonuses'].map((name) => [name, readJson(`../src/data/generated/${name}.json`)]))
const gameTexts = Object.fromEntries(Object.entries(catalogs).flatMap(([name, rows]) => rows.flatMap((row) => italian[name][row.id]?.name ? [[row.name, italian[name][row.id].name]] : [])))
for (const skill of catalogs.skills) {
  const entry = italian.skills[skill.id]
  if (entry?.description) gameTexts[skill.description] = entry.description
  for (const level of skill.levels) {
    if (entry?.levels?.[level.level]) gameTexts[level.description] = entry.levels[level.level]
  }
}

test('Italian catalog entries refer to existing IDs and skill level effects', () => {
  for (const [name, rows] of Object.entries(catalogs)) {
    const byId = new Map(rows.map((row) => [row.id, row]))
    for (const [id, translated] of Object.entries(italian[name])) {
      assert.ok(byId.has(id), `${name}: unknown ID ${id}`)
      assert.ok(translated.name?.trim() || translated.description?.trim())
      if (translated.levels) {
        for (const [level, description] of Object.entries(translated.levels)) {
          assert.ok(byId.get(id).levels.some((entry) => entry.level === Number(level)))
          assert.ok(description.trim())
        }
      }
    }
  }
  assert.equal(italian.skills['critical-eye'].name, 'Occhio critico')
  assert.ok(italian.skills['critical-eye'].description)
  assert.ok(italian.skills['critical-eye'].levels['1'])
  for (const category of ['weapons', 'armor', 'charms', 'decorations', 'setBonuses']) {
    assert.ok(catalogs[category].every((entry) => italian[category][entry.id]?.name), `${category}: missing name`)
  }
  assert.deepEqual(catalogs.skills.filter((skill) => !italian.skills[skill.id]?.name).map((skill) => skill.id).sort(),
    ['fun-frights-gift', 'fun-frights-gratitude', 'inheritance', 'transcendance'])
})

test('switching language translates display text and preserves English fallback', () => {
  const en = createTranslator('en', messages, gameTexts)
  const it = createTranslator('it', messages, gameTexts)
  assert.equal(en('Critical Eye'), 'Critical Eye')
  assert.equal(it('Critical Eye'), 'Occhio critico')
  assert.equal(it('Inheritance'), 'Inheritance')
  assert.equal(it('Dragonbarbs α+'), 'Spine di drago α+')
  assert.equal(it('Shaver Jewel 3'), 'Gioiello potenziamento rampino 3')
  assert.equal(it('Sizzling Gift'), 'Dono sfrigolante')
  assert.equal(it('Sizzling Gratitude'), 'Benedizione sfrigolante')
  const clutch = catalogs.skills.find((skill) => skill.id === 'clutch-claw-boost')
  assert.equal(it(clutch.description), supplemental.skills[clutch.id].description)
  assert.notEqual(it(clutch.description), "Attiva gli effetti dell'abilità.")
  assert.equal(it('Untranslated content'), 'Untranslated content')
  assert.equal(it('constructor'), 'constructor')
  assert.equal(it('Share Build'), 'Condividi build')
  assert.equal(it(undefined), '')
})

test('parameterized labels translate names while keeping numbers unchanged', () => {
  const en = createTranslator('en', messages, gameTexts)
  const it = createTranslator('it', messages, gameTexts)
  assert.equal(en('Select {0}', ['Critical Eye']), 'Select Critical Eye')
  assert.equal(it('Select {0}', ['Critical Eye']), 'Seleziona Occhio critico')
  assert.equal(it('{0} valid builds found.', [3]), '3 build valide trovate.')
  assert.equal(it('{0} valid build found.', [1]), '1 build valida trovata.')
})

test('real equipment remains searchable by English and Italian names and skills', () => {
  const skillNames = new Map(catalogs.skills.map((skill) => [skill.id, bilingualSearchText(skill.name, gameTexts)]))
  for (const name of ['weapons', 'armor', 'charms', 'decorations']) {
    const row = catalogs[name].find((entry) => italian[name][entry.id] && italian[name][entry.id].name !== entry.name)
    const searchable = { ...row, name: bilingualSearchText(row.name, gameTexts) }
    assert.ok(matchesEquipmentSearch(searchable, row.name, skillNames))
    assert.ok(matchesEquipmentSearch(searchable, italian[name][row.id].name, skillNames))
  }
  for (const name of ['armor', 'charms', 'decorations']) {
    const row = catalogs[name].find((entry) => entry.skills.some((skill) => skill.skillId === 'critical-eye'))
    assert.ok(matchesEquipmentSearch(row, 'Critical Eye', skillNames))
    assert.ok(matchesEquipmentSearch(row, 'Occhio critico', skillNames))
  }
})

test('every static interface translation call has an Italian message', () => {
  const directory = new URL('../src/components/', import.meta.url)
  const paths = [new URL('../src/App.tsx', import.meta.url), ...fs.readdirSync(directory).filter((name) => name.endsWith('.tsx')).map((name) => new URL(name, directory))]
  for (const path of paths) {
    const file = ts.createSourceFile(path.pathname, fs.readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const visit = (node) => {
      if (ts.isCallExpression(node) && node.expression.getText(file) === 't') {
        const check = (argument) => {
          if (ts.isStringLiteral(argument)) assert.ok(Object.hasOwn(messages, argument.text), `Missing translation: ${argument.text}`)
          else if (ts.isConditionalExpression(argument)) { check(argument.whenTrue); check(argument.whenFalse) }
        }
        check(node.arguments[0])
      }
      ts.forEachChild(node, visit)
    }
    visit(file)
  }
})
