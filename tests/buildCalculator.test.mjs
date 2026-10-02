import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateBuildStats, catalog } from './engineLoader.mjs'

test('empty equipment has zero base statistics', () => {
  const stats = calculateBuildStats([], null, [], [], [])
  assert.equal(stats.attack, 0)
  assert.equal(stats.affinity, 0)
  assert.equal(stats.defense, 0)
  assert.equal(stats.armorDefense, 0)
  assert.equal(stats.weaponDefenseBonus, 0)
  assert.deepEqual(stats.resistances, { fire: 0, water: 0, thunder: 0, ice: 0, dragon: 0 })
})

test('real equipment totals use armor base defense, weapon bonus and summed resistances', () => {
  const data = catalog()
  const pieces = ['head', 'chest', 'arms', 'waist', 'legs'].map(slot => data.armors.find(armor => armor.slot === slot && armor.rank === 'master'))
  const weapon = data.weapons.find(entry => entry.defenseBonus > 0 && entry.affinity < 0)
  assert.ok(weapon)
  const stats = calculateBuildStats(pieces, weapon, [weapon.skills, ...pieces.map(armor => armor.skills)], data.skills, data.setBonuses)
  const armorDefense = pieces.reduce((sum, armor) => sum + armor.defense.base, 0)
  assert.equal(stats.armorDefense, armorDefense)
  assert.equal(stats.weaponDefenseBonus, weapon.defenseBonus)
  assert.equal(stats.defense, armorDefense + weapon.defenseBonus)
  assert.equal(stats.attack, weapon.attack)
  assert.equal(stats.affinity, weapon.affinity)
  for (const element of ['fire', 'water', 'thunder', 'ice', 'dragon']) {
    assert.equal(stats.resistances[element], pieces.reduce((sum, armor) => sum + armor.resistances[element], 0))
  }
  const withoutWeapon = calculateBuildStats(pieces, null, pieces.map(armor => armor.skills), data.skills, data.setBonuses)
  assert.equal(withoutWeapon.defense, armorDefense)
  assert.equal(withoutWeapon.weaponDefenseBonus, 0)
})

test('skill levels are calculated, while offensive values stay at equipment base values', () => {
  const data = catalog()
  const weapon = data.weapons[0]
  const stats = calculateBuildStats([], weapon, [[{ skillId: 'attack-boost', level: 7 }, { skillId: 'critical-eye', level: 7 }]], data.skills, data.setBonuses)
  assert.equal(stats.skills['attack-boost'].level, 7)
  assert.equal(stats.skills['critical-eye'].level, 7)
  assert.equal(stats.attack, weapon.attack)
  assert.equal(stats.affinity, weapon.affinity)
})
