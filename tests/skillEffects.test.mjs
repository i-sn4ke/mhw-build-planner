import test from 'node:test'
import assert from 'node:assert/strict'
import { simulateOffensiveSkills, defaultSimulationConditions, calculateBuildStats, catalog, weaponAttackMultipliers, supportedOffensiveSkills } from './engineLoader.mjs'

const weapon = (type = 'great-sword', attack = 480, affinity = 0) => ({ id: 'test', type, attack, affinity })
const calculated = levels => Object.fromEntries(Object.entries(levels).map(([id, level]) => [id, { level }]))
const simulate = (levels, changes = {}, entry = weapon()) => simulateOffensiveSkills(entry, calculated(levels), { ...defaultSimulationConditions(), ...changes })

test('all manual conditions start inactive and no weapon produces no simulated bonuses', () => {
  const result = simulate({ agitator: 7, 'weakness-exploit': 3, 'peak-performance': 3, resentment: 5, 'maximum-might': 5, 'latent-power': 7, 'critical-draw': 3 })
  assert.equal(result.attack, 480)
  assert.equal(result.affinity, 0)
  assert.ok(result.contributions.every(entry => !entry.active))
  assert.equal(simulateOffensiveSkills(null, calculated({ 'attack-boost': 7 }), defaultSimulationConditions()).attack, 0)
})

test('Attack Boost applies true raw per weapon class and Critical Eye applies automatically', () => {
  const result = simulate({ 'attack-boost': 7, 'critical-eye': 7 })
  assert.equal(result.attack, 581)
  assert.equal(result.rawAttackBonus, 21)
  assert.equal(result.affinity, 45)
  assert.equal(simulate({ 'attack-boost': 3 }).affinity, 0)
  assert.equal(simulate({ 'attack-boost': 4 }).affinity, 5)
  assert.equal(simulate({ 'attack-boost': 7 }, {}, weapon('bow', 120)).attack, 145)
})

test('half-up display rounding uses integer multiplication before division', () => {
  assert.equal(simulate({ resentment: 1 }, { health: 'recoverable' }, weapon('gunlance', 184)).attack, 196)
})

test('all imported weapons preserve their base attack with no skill effects', () => {
  for (const entry of catalog().weapons) {
    const multiplier = weaponAttackMultipliers[entry.type]
    assert.equal(Math.round(Math.round(entry.attack / multiplier) * multiplier), entry.attack)
    assert.equal(simulateOffensiveSkills(entry, {}, defaultSimulationConditions()).attack, entry.attack)
  }
})

test('Agitator adds attack and affinity only when the monster is enraged', () => {
  assert.equal(simulate({ agitator: 7 }).attack, 480)
  const result = simulate({ agitator: 7 }, { monsterEnraged: true })
  assert.equal(result.attack, 614)
  assert.equal(result.affinity, 20)
})

test('Weakness Exploit separates weak spots and wounded weak spots for all levels', () => {
  const weak = [10, 15, 30]
  const wounded = [15, 30, 50]
  for (let level = 1; level <= 3; level++) {
    assert.equal(simulate({ 'weakness-exploit': level }).affinity, 0)
    assert.equal(simulate({ 'weakness-exploit': level }, { target: 'weak' }).affinity, weak[level - 1])
    assert.equal(simulate({ 'weakness-exploit': level }, { target: 'wounded-weak' }).affinity, wounded[level - 1])
  }
})

test('the health selector makes Peak Performance and Resentment mutually exclusive', () => {
  const levels = { 'peak-performance': 3, resentment: 5 }
  assert.equal(simulate(levels).rawAttackBonus, 0)
  assert.equal(simulate(levels, { health: 'full' }).rawAttackBonus, 20)
  assert.equal(simulate(levels, { health: 'recoverable' }).rawAttackBonus, 25)
})

test('Maximum Might, Latent Power and Critical Draw respect their manual conditions', () => {
  assert.equal(simulate({ 'maximum-might': 4 }, { maximumMightActive: true }).affinity, 40)
  assert.equal(simulate({ 'maximum-might': 5 }, { maximumMightActive: true }).affinity, 40)
  assert.equal(simulate({ 'latent-power': 6 }, { latentPowerActive: true }).affinity, 50)
  assert.equal(simulate({ 'latent-power': 7 }, { latentPowerActive: true }).affinity, 60)
  assert.equal(simulate({ 'critical-draw': 2 }, { drawAttack: true }).affinity, 60)
})

test('stacked bonuses clamp effective affinity but preserve the pre-cap total', () => {
  const result = simulate({ 'attack-boost': 7, 'critical-eye': 7, agitator: 7, 'weakness-exploit': 3 }, { monsterEnraged: true, target: 'wounded-weak' }, weapon('long-sword', 330, 20))
  assert.equal(result.attack, 492)
  assert.equal(result.affinity, 100)
  assert.equal(result.uncappedAffinity, 135)
  assert.equal(simulate({ 'critical-eye': 1 }, {}, weapon('long-sword', 330, -30)).affinity, -25)
})

test('the existing Secret and Inheritance engine controls simulated skill levels', () => {
  const data = catalog()
  const entry = data.weapons.find(entry => entry.type === 'long-sword')
  const source = [{ skillId: 'agitator', level: 7 }, { skillId: 'maximum-might', level: 5 }, { skillId: 'latent-power', level: 7 }]
  const locked = calculateBuildStats([], entry, [source], data.skills, data.setBonuses)
  const unlocked = calculateBuildStats([], entry, [source, [{ skillId: 'inheritance', level: 1 }]], data.skills, data.setBonuses)
  const conditions = { ...defaultSimulationConditions(), monsterEnraged: true, maximumMightActive: true, latentPowerActive: true }
  const normal = simulateOffensiveSkills(entry, locked.skills, conditions)
  const secret = simulateOffensiveSkills(entry, unlocked.skills, conditions)
  assert.equal(normal.rawAttackBonus, 20)
  assert.equal(normal.affinityBonus, 90)
  assert.equal(secret.rawAttackBonus, 28)
  assert.equal(secret.affinityBonus, 120)
})

test('unsupported skill effects are excluded', () => {
  const result = simulate({ heroics: 7, 'offensive-guard': 3, fortify: 1, coalescence: 3, 'critical-boost': 3 })
  assert.equal(result.attack, 480)
  assert.equal(result.affinity, 0)
  assert.equal(result.contributions.length, 0)
})

test('supported flat bonuses agree with every imported level description', () => {
  const data = catalog()
  for (const id of supportedOffensiveSkills) {
    if (id === 'weakness-exploit') continue // Wounded-part values have their own test above.
    const definition = data.skills.find(skill => skill.id === id)
    for (const entry of definition.levels) {
      const conditions = { monsterEnraged: true, health: id === 'resentment' ? 'recoverable' : 'full', maximumMightActive: true, latentPowerActive: true, drawAttack: true }
      const result = simulate({ [id]: entry.level }, conditions)
      const attack = entry.description.match(/attack\s*\+(\d+)/i)
      const affinity = entry.description.match(/affinity\s*(?:\+|by\s+)(\d+)%/i)
      assert.equal(result.rawAttackBonus, attack ? Number(attack[1]) : 0, `${id} ${entry.level} attack`)
      assert.equal(result.affinityBonus, affinity ? Number(affinity[1]) : 0, `${id} ${entry.level} affinity`)
    }
  }
})
