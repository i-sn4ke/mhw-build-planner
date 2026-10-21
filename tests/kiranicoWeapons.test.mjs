import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { kiranicoWeaponTypes, parseKiranicoWeaponIndex, parseKiranicoWeaponDetail, weaponIdentity } from '../scripts/import-mhw-data/kiranico-weapons.mjs'
import { catalog, serializeBuild, deserializeBuild, matchesWeaponElement } from './engineLoader.mjs'

const read = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'))
const data = catalog()
const source = read('../scripts/import-mhw-data/sources/kiranico-weapons.json')
const snapshot = read('../scripts/import-mhw-data/sources/kiranico-weapon-index.json')
const italian = read('../src/i18n/generated/it.json').weapons
const weapon = (key) => data.weapons.find((entry) => entry.id === `kiranico-${key}`)

test('all 14 Kiranico categories are covered, with explicit exclusions and no unexplained omissions', () => {
  assert.deepEqual(new Set(snapshot.entries.map((entry) => entry.type)), new Set(kiranicoWeaponTypes))
  assert.equal(snapshot.entries.length, 3695)
  assert.equal(new Set(snapshot.entries.map((entry) => entry.key)).size, 3695)
  assert.equal(source.weapons.length, 22)
  assert.equal(source.excluded.length, 14)
  const present = new Set(data.weapons.map(weaponIdentity))
  const excluded = new Set(source.excluded.map(weaponIdentity))
  assert.deepEqual(snapshot.entries.filter((entry) => !present.has(weaponIdentity(entry)) && !excluded.has(weaponIdentity(entry))), [])
  for (const entry of source.excluded) {
    assert.ok(entry.reason)
    assert.ok(!present.has(weaponIdentity(entry)))
  }
})

test('supplemental weapons preserve IDs, Italian names, upgrade links and shared builds', () => {
  assert.equal(data.weapons.length, 3566)
  assert.equal(new Set(data.weapons.map((entry) => entry.id)).size, data.weapons.length)
  for (const entry of source.weapons) {
    assert.deepEqual(data.weapons.find((item) => item.id === entry.weapon.id), entry.weapon)
    assert.equal(italian[entry.weapon.id].name, entry.nameIt)
    assert.ok(entry.source.startsWith('https://mhworld.kiranico.com/en/weapons/'))
    if (entry.weapon.previousWeaponId) {
      const previous = data.weapons.find((item) => item.id === entry.weapon.previousWeaponId)
      assert.ok(previous)
      assert.equal(previous.type, entry.weapon.type)
    }
    const saved = { version: 1, weaponId: entry.weapon.id, armor: {}, charmId: null, decorations: [] }
    assert.deepEqual(serializeBuild(deserializeBuild(saved, data)), saved)
  }
  assert.equal(data.weapons.find((entry) => entry.id === '1187').name, 'Azure Star "Dragon Dance"')
})

test('reported Azure Era bow has correct stats, usable slots and base upgrade', () => {
  const bow = weapon('80hAxI63')
  assert.equal(italian[bow.id].name, 'Era azzurra "Drago ruggente"+')
  assert.equal(bow.type, 'bow')
  assert.equal(bow.rarity, 12)
  assert.equal(bow.attack, 324)
  assert.equal(bow.affinity, 30)
  assert.deepEqual(bow.elements, [{ type: 'Water', damage: 330, hidden: false }])
  assert.deepEqual(bow.slots, [{ size: 4 }, { size: 4 }])
  assert.ok(matchesWeaponElement(bow, 'water'))
  assert.equal(bow.previousWeaponId, weapon('G0hq7UM5').id)
  assert.equal(weapon('G0hq7UM5').attack, 312)
  assert.deepEqual(weapon('G0hq7UM5').slots, [{ size: 4 }])
})

test('Xeno upgrades cover every weapon category and preserve special weapon mechanics', () => {
  const xeno = source.weapons.map((entry) => entry.weapon).filter((entry) => entry.name.startsWith('Xeno '))
  assert.equal(xeno.length, 14)
  assert.deepEqual(new Set(xeno.map((entry) => entry.type)), new Set(kiranicoWeaponTypes))
  for (const entry of xeno) {
    assert.equal(entry.rarity, 12)
    assert.deepEqual(entry.slots, [{ size: 4 }, { size: 4 }])
    assert.ok(entry.previousWeaponId)
  }
  assert.equal(weapon('OofkCaK').notes, 'PBO')
  assert.equal(weapon('JRsbC3p').kinsectBonus, 'stamina_health')
  assert.equal(weapon('aKSBCZE').shelling, 'long')
  assert.equal(weapon('aKSBCZE').shellingLevel, 6)
  assert.equal(weapon('l7TaCN4').phial, 'impact')
  assert.equal(weapon('XxUPCKY').phial, 'power')
})

test('event weapons normalize dual status, hidden elements and elemental phials', () => {
  assert.deepEqual(weapon('yJFoYt5D').elements.map((entry) => entry.damage), [120, 60])
  assert.deepEqual(weapon('ZxFg7t2P').elements.map((entry) => entry.damage), [150, 90])
  assert.ok(matchesWeaponElement(weapon('ZxFg7t2P'), 'paralysis'))
  assert.ok(matchesWeaponElement(weapon('ZxFg7t2P'), 'sleep'))
  assert.deepEqual(weapon('q8HvWUwg').elements, [{ type: 'Fire', damage: 690, hidden: true }])
  assert.equal(matchesWeaponElement(weapon('q8HvWUwg'), 'fire'), false)
  assert.equal(weapon('2DTb6ILk').phial, 'power element')
  assert.equal(weapon('MxTkxIak').previousWeaponId, weapon('2DTb6ILk').id)
})

test('audit identity handles MR suffixes without merging HR and MR Kulve weapons', () => {
  const base = { name: 'Taroth Sword "Fire"', type: 'long-sword', rarity: 12 }
  assert.equal(weaponIdentity(base), weaponIdentity({ ...base, name: base.name + ' (MR)' }))
  assert.notEqual(weaponIdentity(base), weaponIdentity({ ...base, rarity: 8 }))
  assert.notEqual(weaponIdentity(base), weaponIdentity({ ...base, type: 'bow' }))
})

test('Kiranico index parser decodes names and rejects incomplete or duplicate data', () => {
  const row = '<tr><td><a href="https://mhworld.kiranico.com/en/weapons/test/bow">Bow &quot;Water&quot;+</a></td><td>Rarity 12</td></tr>'
  assert.deepEqual(parseKiranicoWeaponIndex(row, 'bow')[0], {
    key: 'test', type: 'bow', name: 'Bow "Water"+', rarity: 12, url: 'https://mhworld.kiranico.com/en/weapons/test/bow',
  })
  assert.throws(() => parseKiranicoWeaponIndex('', 'bow'), /Empty/)
  assert.throws(() => parseKiranicoWeaponIndex(row + row, 'bow'), /Duplicate/)
  assert.throws(() => parseKiranicoWeaponIndex(row.replace('Rarity 12', 'Unknown'), 'bow'), /rarity/)
})

test('Kiranico detail parser reads icon-only slots and validates weapon statistics', () => {
  const field = (label, value) => `<td><strong>${value}</strong><div class="balance-label smaller">${label}</div></td>`
  const html = `<table><tbody><tr>${field('Rarity', 'Rarity 12')}${field('Attack', '324 | 270')}${field('Affinity', '30%')}${field('Defense Bonus', '(+0)')}${field('Slots', '<img src="slot_size_4.png"><img src="slot_size_4.png">')}${field('Element', '<img src="element_2.png">Water 330')}</tr></tbody></table>`
  const entry = { key: '80hAxI63', name: 'Azure Era "Soaring Dragon"+', type: 'bow', rarity: 12 }
  const parsed = parseKiranicoWeaponDetail(html, entry)
  const expected = { ...weapon('80hAxI63') }
  delete expected.previousWeaponId
  assert.deepEqual(parsed.weapon, expected)
  assert.throws(() => parseKiranicoWeaponDetail(html, { ...entry, rarity: 9 }), /Rarity mismatch/)
  assert.throws(() => parseKiranicoWeaponDetail(html.replace('324 | 270', '?'), entry), /Missing Attack/)
})
