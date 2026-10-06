import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { calculateLongSwordDamage, defaultSimulationConditions, catalog } from './engineLoader.mjs'

const data = JSON.parse(fs.readFileSync(new URL('../src/data/generated/damageSimulation.json', import.meta.url), 'utf8'))
const jagras = data.monsters.find(entry => entry.id === 'great-jagras')
const head = jagras.parts.find(entry => entry.id === 'head')
const step = data.attacks.find(entry => entry.id === 'step-slash')
const weapon = { id: 'fixture', type: 'long-sword', attack: 330, affinity: 0, elements: [] }
const calculated = levels => Object.fromEntries(Object.entries(levels).map(([id, level]) => [id, { level }]))
const simulate = ({ entry = weapon, levels = {}, conditions = {}, scenario = {}, monster = jagras, part = head, attack = step } = {}) => calculateLongSwordDamage(
  entry, calculated(levels), { ...defaultSimulationConditions(), ...conditions }, monster, part, attack,
  { sharpness: 'white', spirit: 'none', wounded: false, sweetspot: false, ...scenario },
)

test('basic sever hit uses true raw and independently rounded raw/element damage', () => {
  // 100 true raw, Step Slash MV24, head80, white1.32 -> 25 physical.
  const result = simulate()
  assert.equal(result.normal.total, 25)
  assert.equal(result.critical.total, 32)
  assert.equal(result.feeble.total, 19)
  assert.equal(result.average.total, 25)
  assert.equal(simulate({ entry: null }), null)
  assert.equal(simulate({ entry: { ...weapon, type: 'great-sword' } }), null)
})

test('average weights rounded positive or negative affinity outcomes; Critical Boost only improves positive crits', () => {
  assert.equal(simulate({ entry: { ...weapon, affinity: 50 } }).average.total, 28.5)
  const negative = simulate({ entry: { ...weapon, affinity: -50 }, levels: { 'critical-boost': 3 } })
  assert.equal(negative.average.total, 22)
  assert.equal(negative.feeble.total, 19)
  assert.equal(simulate({ entry: { ...weapon, affinity: 100 }, levels: { 'critical-boost': 3 } }).average.total, 35)
})

test('Spirit multiplies attack after flat bonuses and rounds true raw before damage', () => {
  const result = simulate({ levels: { 'attack-boost': 7 }, scenario: { spirit: 'red' } })
  assert.equal(result.trueRaw, 145) // round((100+21)*1.20)
  assert.equal(result.normal.physical, 37)
  assert.equal(simulate({ scenario: { spirit: 'white' } }).trueRaw, 105)
  assert.equal(simulate({ scenario: { spirit: 'yellow' } }).trueRaw, 110)
})

test('Weakness Exploit follows part hitzone, not the manual target or sharpness', () => {
  const rathalos = data.monsters.find(entry => entry.id === 'rathalos')
  const body = rathalos.parts.find(entry => entry.id === 'body')
  const result = simulate({ monster: rathalos, part: body, levels: { 'weakness-exploit': 3 }, conditions: { target: 'wounded-weak' }, scenario: { sharpness: 'purple' } })
  assert.equal(result.affinity, 0)
  assert.equal(result.weakSpot, false)
  assert.equal(simulate({ levels: { 'weakness-exploit': 3 } }).affinity, 30)
  const rathian = data.monsters.find(entry => entry.id === 'rathian')
  const wounded = simulate({ monster: rathian, part: rathian.parts.find(entry => entry.id === 'body'), levels: { 'weakness-exploit': 3 }, scenario: { wounded: true } })
  assert.equal(wounded.effectiveSever, 51)
  assert.equal(wounded.affinity, 50)
  assert.equal(simulate({ monster: rathalos, part: body, levels: { 'weakness-exploit': 3 }, scenario: { wounded: true } }).affinity, 0)
})

test('enrage changes received damage and shared Agitator conditions; health bonuses stay conditional', () => {
  assert.equal(simulate({ conditions: { monsterEnraged: true } }).normal.physical, 28)
  const enraged = simulate({ levels: { agitator: 7 }, conditions: { monsterEnraged: true } })
  assert.equal(enraged.trueRaw, 128)
  assert.equal(enraged.affinity, 20)
  assert.equal(simulate({ levels: { 'peak-performance': 3 }, conditions: { health: 'full' } }).trueRaw, 120)
  assert.equal(simulate({ levels: { 'peak-performance': 3 } }).trueRaw, 100)
})

test('Iceborne elemental sharpness and Critical Element are separate from physical Critical Boost', () => {
  const entry = { ...weapon, elements: [{ type: 'fire', damage: 100, hidden: false }] }
  const result = simulate({ entry, levels: { 'critical-element': 1 } })
  assert.equal(result.normal.elemental, 3)
  assert.equal(result.critical.elemental, 5) // round(round(10*1.35)*1.15*.30)
  assert.equal(simulate({ entry, levels: { 'critical-boost': 3 } }).critical.elemental, 3)
  assert.equal(simulate({ entry, levels: { 'critical-element': 1, 'true-critical-element': 1 } }).critical.elemental, 6)
  assert.equal(simulate({ entry, scenario: { spirit: 'red' } }).normal.elemental, 3)
  assert.equal(simulate({ entry, scenario: { sharpness: 'purple' } }).normal.elemental, 4)
})

test('element attack respects the Iceborne cap and zero hitzones stay immune', () => {
  const entry = { ...weapon, elements: [{ type: 'fire', damage: 100, hidden: false }] }
  assert.equal(simulate({ entry, levels: { 'fire-attack': 6 } }).trueElement, 22)
  const highBase = { ...weapon, elements: [{ type: 'fire', damage: 600, hidden: false }] }
  assert.equal(simulate({ entry: highBase, levels: { 'fire-attack': 6 } }).trueElement, 82)
  const water = { ...weapon, elements: [{ type: 'water', damage: 600, hidden: false }] }
  assert.equal(simulate({ entry: water }).normal.elemental, 0)
})

test('hidden elements require Free Elem; elemental skills alone cannot activate them', () => {
  const hidden = { ...weapon, elements: [{ type: 'fire', damage: 300, hidden: true }] }
  assert.equal(simulate({ entry: hidden, levels: { 'fire-attack': 6 } }).normal.elemental, 0)
  assert.equal(simulate({ entry: hidden, levels: { 'free-elem-ammo-up': 1 } }).trueElement, 10)
  assert.equal(simulate({ entry: hidden, levels: { 'free-elem-ammo-up': 2 } }).trueElement, 20)
  assert.equal(simulate({ entry: hidden, levels: { 'free-elem-ammo-up': 3 } }).trueElement, 30)
  assert.equal(simulate({ entry: hidden, levels: { 'non-elemental-boost': 1 } }).trueRaw, 105)
  assert.equal(simulate({ entry: hidden, levels: { 'non-elemental-boost': 1, 'free-elem-ammo-up': 1 } }).trueRaw, 100)
})

test('status attributes are not elemental hit damage and disable Non-elemental Boost when active', () => {
  for (const type of ['poison', 'blast', 'paralysis', 'sleep']) {
    const result = simulate({ entry: { ...weapon, elements: [{ type, damage: 300, hidden: false }] }, levels: { 'non-elemental-boost': 1 } })
    assert.equal(result.element, null)
    assert.equal(result.normal.elemental, 0)
    assert.equal(result.trueRaw, 100)
  }
})

test('Critical Draw is eligible only for Step Slash; optional blade sweetspot improves raw only', () => {
  assert.equal(simulate({ levels: { 'critical-draw': 3 }, conditions: { drawAttack: true } }).affinity, 100)
  assert.equal(simulate({ attack: data.attacks.find(entry => entry.id === 'thrust'), levels: { 'critical-draw': 3 }, conditions: { drawAttack: true } }).affinity, 0)
  assert.equal(simulate({ scenario: { sweetspot: true } }).normal.physical, 26)
})

test('positive sub-one damage rounds up, while actual immunity stays zero', () => {
  const part = { ...head, sever: 1, elements: { ...head.elements, fire: 1 } }
  const entry = { ...weapon, elements: [{ type: 'fire', damage: 10, hidden: false }] }
  const result = simulate({ entry, part, scenario: { sharpness: 'red' } })
  assert.equal(result.normal.physical, 1)
  assert.equal(result.normal.elemental, 1)
  assert.equal(simulate({ entry, part: { ...part, sever: 0 } }).normal.physical, 0)
})

test('real catalog Long Swords produce finite results for every imported part', () => {
  for (const entry of catalog().weapons.filter(entry => entry.type === 'long-sword')) {
    for (const monster of data.monsters) for (const part of monster.parts) {
      const result = simulate({ entry, monster, part })
      assert.ok(Number.isFinite(result.average.total) && result.average.total >= 0, entry.name)
    }
  }
  assert.deepEqual(data.attacks.map(entry => entry.motionValue), [24, 21, 12, 18, 22])
})

test('real catalog elemental type capitalization retains elemental damage', () => {
  const pale = catalog().weapons.find(entry => entry.name === 'Wyvern Blade "Pale"')
  const result = simulate({ entry: pale })
  assert.equal(result.element, 'fire')
  assert.equal(result.trueElement, 42)
  assert.equal(result.normal.elemental, 14)
  assert.equal(result.normal.total, 82)
  assert.ok(Math.abs(result.average.total - 85.6) < 1e-10)
})
