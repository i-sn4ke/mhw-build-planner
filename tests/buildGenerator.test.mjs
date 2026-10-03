import test from 'node:test'
import assert from 'node:assert/strict'
import { generateBuilds, generateBuildsForWeaponType, calculateBuildStats, deserializeBuild, serializeBuild, matchesWeaponElement, matchesEquipmentSearch, catalog } from './engineLoader.mjs'

const slots = ['head', 'chest', 'arms', 'waist', 'legs']
const skill = (skillId, level) => ({ skillId, level })
const definition = (id, maxLevel, extra = {}) => ({ id, name: id, description: '', levels: [], maxLevel, ...extra })
const armor = (slot, extra = {}) => ({
  id: slot, name: slot, slot, rank: 'master', rarity: 12,
  defense: { base: 100, max: 150, augmentMax: 200 },
  resistances: { fire: 0, water: 0, thunder: 0, ice: 0, dragon: 0 },
  slots: [], skills: [], ...extra,
})
const weapon = (extra = {}) => ({ id: 'weapon', name: 'weapon', type: 'long-sword', rarity: 12, attack: 100, affinity: 0, elements: [], slots: [], skills: [], ...extra })
const decoration = (id, slotSize, skills) => ({ id, name: id, slotSize, rarity: 1, skills })
function database(extra = {}) {
  return { armors: slots.map((slot) => armor(slot)), weapons: [weapon()], charms: [], decorations: [], skills: [definition('attack', 7)], setBonuses: [], ...extra }
}
const request = (skills = [skill('attack', 1)], rank = 'master') => ({ weaponId: 'weapon', rank, skills })

function verify(result, input, data) {
  assert.ok(result.builds.length <= 3)
  for (const candidate of result.builds) {
    const build = deserializeBuild(candidate.build, data)
    assert.equal(build.selectedWeapon.id, input.weaponId)
    const pieces = Object.values(build.selectedArmor)
    assert.equal(pieces.length, 5)
    assert.ok(pieces.every((piece) => piece.rank === input.rank))
    assert.equal(build.decorations.length, candidate.build.decorations.length)
    assert.equal(new Set(build.decorations.map((entry) => JSON.stringify(entry.location))).size, build.decorations.length)
    const stats = calculateBuildStats(pieces, build.selectedWeapon, [
      ...pieces.map((piece) => piece.skills), build.selectedWeapon.skills,
      build.selectedCharm?.skills ?? [], ...build.decorations.map((entry) => entry.decoration.skills),
    ], data.skills, data.setBonuses)
    for (const required of input.skills) assert.ok((stats.skills[required.skillId]?.level ?? 0) >= required.level)
    assert.deepEqual(candidate.skills, stats.skills)
    assert.deepEqual(serializeBuild(build), candidate.build)
  }
}

test('uses only the selected armor rank and keeps the chosen weapon regardless of rarity', () => {
  const data = database({ armors: [
    ...slots.map((slot) => armor(slot, { rank: 'low', skills: [skill('attack', 1)] })),
    ...slots.map((slot) => armor(slot, { id: `high-${slot}`, rank: 'high', skills: [skill('attack', 1)] })),
  ] })
  const input = request([skill('attack', 5)], 'low')
  const result = generateBuilds(input, data)
  assert.ok(result.builds.length)
  verify(result, input, data)
})

test('keeps fixed armor pieces in their selected slots', () => {
  const fixedHead = armor('head', { id: 'fixed-head', skills: [skill('attack', 1)] })
  const data = database({ armors: [fixedHead, ...slots.filter((slot) => slot !== 'head').map((slot) => armor(slot))] })
  const input = { ...request(), fixedArmor: { head: fixedHead.id } }
  const result = generateBuilds(input, data)

  assert.ok(result.builds.length)
  assert.ok(result.builds.every((candidate) => candidate.build.armor.head === fixedHead.id))
  verify(result, input, data)
})

test('rejects fixed armor from another slot or rank', () => {
  const data = database({ armors: [
    ...slots.map((slot) => armor(slot)),
    armor('chest', { id: 'high-head', slot: 'head', rank: 'high' }),
  ] })

  assert.throws(() => generateBuilds({ ...request(), fixedArmor: { head: 'chest' } }, data), /does not match its selected slot/)
  assert.throws(() => generateBuilds({ ...request(), fixedArmor: { head: 'high-head' } }, data), /must match the selected armor rank/)
})

test('fills mixed slots with unlimited copies and combined-skill decorations', () => {
  const data = database({
    armors: slots.map((slot) => armor(slot, { slots: slot === 'head' ? [{ size: 1 }, { size: 4 }] : [] })),
    weapons: [weapon({ slots: [{ size: 1 }] })],
    skills: [definition('attack', 7), definition('expert', 7)],
    decorations: [decoration('attack-jewel', 1, [skill('attack', 1)]), decoration('combo-jewel', 4, [skill('attack', 1), skill('expert', 1)])],
  })
  const input = request([skill('attack', 3), skill('expert', 1)])
  const result = generateBuilds(input, data)
  assert.equal(result.builds.length, 1)
  assert.equal(result.builds[0].build.decorations.filter((entry) => entry.decorationId === 'attack-jewel').length, 2)
  verify(result, input, data)
})

test('does not put a size 4 decoration into smaller slots', () => {
  const data = database({ armors: slots.map((slot) => armor(slot, { slots: [{ size: 3 }] })), decorations: [decoration('large', 4, [skill('attack', 7)])] })
  const result = generateBuilds(request(), data)
  assert.equal(result.status, 'exhausted')
  assert.equal(result.builds.length, 0)
})

function secretDatabase(unlock = 'secret') {
  return database({
    armors: slots.map((slot) => armor(slot, { skills: [skill('attack', 2)], setBonusId: 'set' })),
    skills: [definition('attack', 7, { secret: 2 }), definition('secret', 1, { unlocksSkillId: 'attack' }), definition('inheritance', 1)],
    setBonuses: [{ id: 'set', name: 'set', thresholds: [{ pieces: 2, skillId: unlock }] }],
  })
}
test('rejects raw skill levels above the locked normal cap', () => {
  const data = secretDatabase()
  data.setBonuses = []
  const result = generateBuilds(request([skill('attack', 7)]), data)
  assert.equal(result.status, 'exhausted')
  assert.equal(result.builds.length, 0)
})
test('unlocks a Secret cap from armor thresholds', () => {
  const data = secretDatabase()
  const input = request([skill('attack', 7)])
  const result = generateBuilds(input, data)
  assert.ok(result.builds.length)
  assert.ok(result.builds[0].skills.attack.secretUnlocked)
  verify(result, input, data)
})
test('Inheritance unlocks multiple requested Secret caps', () => {
  const data = secretDatabase('inheritance')
  data.skills.push(definition('expert', 5, { secret: 2 }))
  data.armors.forEach((piece) => piece.skills.push(skill('expert', 1)))
  const input = request([skill('attack', 7), skill('expert', 5)])
  const result = generateBuilds(input, data)
  assert.ok(result.builds.length)
  verify(result, input, data)
})
test('counts a fixed weapon toward set bonus thresholds', () => {
  const data = secretDatabase()
  data.armors.forEach((piece) => { delete piece.setBonusId })
  data.armors[0].setBonusId = 'set'
  data.weapons[0].setBonusId = 'set'
  const input = request([skill('attack', 7)])
  const result = generateBuilds(input, data)
  assert.ok(result.builds.length)
  verify(result, input, data)
})
test('can satisfy a requested set bonus skill directly', () => {
  const data = secretDatabase()
  const input = request([skill('secret', 1)])
  const result = generateBuilds(input, data)
  assert.ok(result.builds.length)
  verify(result, input, data)
})
test('supports a charm and a decoration that unlocks the Secret cap', () => {
  const data = secretDatabase()
  data.setBonuses = []
  data.armors = slots.map((slot) => armor(slot, { slots: slot === 'head' ? [{ size: 1 }] : [] }))
  data.charms = [{ id: 'charm', name: 'charm', rarity: 1, skills: [skill('attack', 7)] }]
  data.decorations = [decoration('unlock', 1, [skill('secret', 1)])]
  const input = request([skill('attack', 7)])
  const result = generateBuilds(input, data)
  assert.ok(result.builds.length)
  verify(result, input, data)
})
test('returns at most three distinct builds, including equivalent armor alternatives', () => {
  const data = database({ armors: slots.flatMap((slot) => Array.from({ length: 5 }, (_, index) => armor(slot, { id: `${slot}-${index}`, skills: [skill('attack', 1)] }))) })
  const result = generateBuilds(request(), data)
  assert.equal(result.status, 'found')
  assert.equal(result.builds.length, 3)
  assert.equal(new Set(result.builds.map((entry) => JSON.stringify(entry.build))).size, 3)
  assert.equal(new Set(result.builds.map(({ build }) => slots.map((slot) => `${slot}:${slot}`).join('|'))).size, 1)
  verify(result, request(), data)
})
test('does not return the same armor pieces in the same slots more than once', () => {
  const data = database({
    charms: [0, 1, 2].map((index) => ({ id: `charm-${index}`, name: `Charm ${index}`, rarity: 1, skills: [skill('attack', 1)] })),
  })
  const result = generateBuilds(request(), data)
  assert.equal(result.builds.length, 1)
  assert.equal(result.status, 'exhausted')
  verify(result, request(), data)
})

test('distinguishes a bounded search from proven absence of solutions', () => {
  const data = database({ decorations: [decoration('attack-jewel', 1, [skill('attack', 1)])], armors: slots.map((slot) => armor(slot, { slots: [{ size: 1 }] })) })
  const result = generateBuilds(request(), data, { maxNodes: 0 })
  assert.equal(result.status, 'limit')
  assert.equal(result.builds.length, 0)
})
test('validates requested levels, skills and weapon IDs', () => {
  const data = database()
  for (const input of [request([]), request([skill('attack', 8)]), request([skill('attack', 1.5)]), request([skill('missing', 1)]), { ...request(), weaponId: 'missing' }]) {
    assert.throws(() => generateBuilds(input, data))
  }
})
test('element filtering excludes hidden elements but Any accepts statuses and hidden elements', () => {
  assert.equal(matchesWeaponElement(weapon({ elements: [{ type: 'Fire', damage: 300, hidden: false }] }), 'fire'), true)
  assert.equal(matchesWeaponElement(weapon({ elements: [{ type: 'Fire', damage: 300, hidden: true }] }), 'fire'), false)
  assert.equal(matchesWeaponElement(weapon({ elements: [{ type: 'Poison', damage: 300, hidden: true }] }), 'all'), true)
})

test('equipment search matches item names and names of their associated skills', () => {
  const entry = weapon({ name: 'Frostfang Great Sword', skills: [skill('critical-eye', 2)] })
  const names = new Map([['critical-eye', 'Critical Eye']])
  assert.equal(matchesEquipmentSearch(entry, 'frostfang', names), true)
  assert.equal(matchesEquipmentSearch(entry, 'critical', names), true)
  assert.equal(matchesEquipmentSearch(entry, 'eye', names), true)
  assert.equal(matchesEquipmentSearch({ name: 'Rathalos Helm', skills: [skill('critical-eye', 1)] }, 'critical', names), true)
  assert.equal(matchesEquipmentSearch(entry, '  ', names), true)
  assert.equal(matchesEquipmentSearch(entry, 'attack boost', names), false)
})

test('real catalog supports Poison, Paralysis, Sleep and Blast filters with hidden attributes excluded', () => {
  const data = catalog()
  for (const status of ['poison', 'paralysis', 'sleep', 'blast']) {
    const active = data.weapons.find(entry => entry.elements.some(element => element.type.toLowerCase() === status && !element.hidden))
    const hidden = data.weapons.find(entry => entry.elements.some(element => element.type.toLowerCase() === status && element.hidden))
    assert.ok(active, `${status} active weapon`)
    assert.ok(hidden, `${status} hidden weapon`)
    assert.equal(matchesWeaponElement(active, status), true)
    assert.equal(matchesWeaponElement(hidden, status), false)
    assert.equal(matchesWeaponElement(hidden, 'all'), true)
  }
})

test('real catalog: generates and round-trips builds for all ranks', () => {
  const data = catalog()
  for (const rank of ['low', 'high', 'master']) {
    const input = { weaponId: data.weapons.find((entry) => entry.type === 'long-sword').id, rank, skills: [skill('attack-boost', 4), skill('critical-eye', 3)] }
    const result = generateBuilds(input, data)
    assert.ok(result.builds.length, `${rank}: ${result.status}`)
    verify(result, input, data)
  }
})

test('real catalog: weapon-type generation returns different eligible weapons', () => {
  const data = catalog()
  const input = { weaponType: 'long-sword', rank: 'master', skills: [skill('critical-eye', 5)] }
  const result = generateBuildsForWeaponType(input, data)

  assert.equal(result.builds.length, 3)
  assert.equal(new Set(result.builds.map((candidate) => candidate.build.weaponId)).size, 3)
  const weaponById = new Map(data.weapons.map((weapon) => [weapon.id, weapon]))
  const roots = result.builds.map((candidate) => {
    let weapon = weaponById.get(candidate.build.weaponId)
    while (weapon.previousWeaponId && weaponById.has(weapon.previousWeaponId)) {
      weapon = weaponById.get(weapon.previousWeaponId)
    }
    return weapon.id
  })
  assert.equal(new Set(roots).size, 3)
  for (const candidate of result.builds) {
    const selectedWeapon = data.weapons.find((entry) => entry.id === candidate.build.weaponId)
    assert.equal(selectedWeapon.type, input.weaponType)
    assert.ok(selectedWeapon.rarity >= 9 && selectedWeapon.rarity <= 12)
    assert.ok(candidate.skills['critical-eye'].level >= 5)
  }
})

test('weapon-type generation preserves fixed armor pieces', () => {
  const data = database({ armors: slots.map((slot) => armor(slot, { skills: slot === 'legs' ? [skill('attack', 1)] : [] })) })
  const input = { weaponType: 'long-sword', rank: 'master', skills: [skill('attack', 1)], fixedArmor: { legs: 'legs' } }
  const result = generateBuildsForWeaponType(input, data)

  assert.equal(result.builds.length, 1)
  assert.equal(result.builds[0].build.armor.legs, 'legs')
  verify({ builds: result.builds }, { ...input, weaponId: 'weapon' }, data)
})

test('real catalog: Agitator 7 requires a valid Secret unlock', () => {
  const data = catalog()
  const input = { weaponId: data.weapons.find((entry) => entry.type === 'long-sword').id, rank: 'master', skills: [skill('agitator', 7), skill('critical-eye', 7), skill('weakness-exploit', 3)] }
  const result = generateBuilds(input, data)
  assert.ok(result.builds.length, result.status)
  verify(result, input, data)
  assert.ok(result.builds.every((entry) => entry.skills.agitator.secretUnlocked))
})

test('real catalog: build suggestions prefer different armor set layouts over alpha/beta variants', () => {
  const data = catalog()
  const selectedWeapon = data.weapons.find((entry) => /frostfang/i.test(entry.name))
  assert.ok(selectedWeapon)
  const input = {
    weaponId: selectedWeapon.id,
    rank: 'master',
    skills: [
      skill('masters-touch', 1), skill('critical-boost', 1),
      skill('critical-draw', 1), skill('critical-eye', 4), skill('weakness-exploit', 1),
    ],
  }
  const result = generateBuilds(input, data)
  assert.equal(result.builds.length, 3, result.status)
  const armorById = new Map(data.armors.map((piece) => [piece.id, piece]))
  const layout = build => slots.map(slot => {
    const piece = armorById.get(build.armor[slot])
    return `${slot}:${piece.setBonusId ?? piece.name.replace(/\s+[αβ](?:\+)?$/u, '')}`
  })
  const layouts = result.builds.map(({ build }) => layout(build))
  assert.equal(new Set(layouts.map(value => value.join('|'))).size, 3)
  for (let left = 0; left < layouts.length; left++) {
    for (let right = left + 1; right < layouts.length; right++) {
      assert.ok(layouts[left].filter((family, index) => family !== layouts[right][index]).length >= 2)
    }
  }
  verify(result, input, data)
})

test('weapon-type generation uses rarity for weapon rank and returns distinct eligible weapons', () => {
  const data = database({ weapons: [
    weapon({ id: 'low-long-sword', rarity: 4, skills: [skill('attack', 1)] }),
    weapon({ id: 'master-long-sword-a', rarity: 9, skills: [skill('attack', 1)] }),
    weapon({ id: 'high-long-sword', rarity: 8, skills: [skill('attack', 1)] }),
    weapon({ id: 'master-long-sword-b', rarity: 10, skills: [skill('attack', 1)] }),
    weapon({ id: 'other-class', type: 'great-sword', rarity: 12, skills: [skill('attack', 1)] }),
    weapon({ id: 'master-long-sword-c', rarity: 12, skills: [skill('attack', 1)] }),
  ] })
  const input = { weaponType: 'long-sword', rank: 'master', skills: [skill('attack', 1)] }
  const result = generateBuildsForWeaponType(input, data)
  const weaponIds = result.builds.map((candidate) => candidate.build.weaponId)

  assert.equal(result.status, 'found')
  assert.equal(result.builds.length, 3)
  assert.equal(new Set(weaponIds).size, 3)
  for (const candidate of result.builds) {
    const selectedWeapon = data.weapons.find((entry) => entry.id === candidate.build.weaponId)
    assert.equal(selectedWeapon.type, input.weaponType)
    assert.ok(selectedWeapon.rarity >= 9 && selectedWeapon.rarity <= 12)
    verify({ builds: [candidate] }, { ...input, weaponId: selectedWeapon.id }, data)
  }
})

test('pruning agrees with exhaustive search on small deterministic catalogs', () => {
  let seed = 42
  const random = (max) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max }
  for (let example = 0; example < 30; example++) {
    const data = database({
      skills: [definition('attack', 4, { secret: 1 }), definition('expert', 3), definition('secret', 1, { unlocksSkillId: 'attack' }), definition('inheritance', 1)],
      armors: slots.flatMap((slot, index) => Array.from({ length: index < 2 ? 2 : 1 }, (_, alternative) => armor(slot, {
        id: `${slot}-${alternative}`, skills: [skill('attack', random(2)), skill('expert', random(2))],
        slots: index < 2 && random(2) ? [{ size: 1 + random(2) }] : [],
        setBonusId: random(2) ? 'set' : undefined,
      }))),
      weapons: [weapon({ setBonusId: random(2) ? 'set' : undefined })],
      charms: [{ id: 'charm', name: 'charm', rarity: 1, skills: [skill('attack', random(2))] }],
      decorations: [decoration('a', 1, [skill('attack', 1)]), decoration('e', 2, [skill('expert', 2)]), decoration('unlock', 2, [skill('inheritance', 1)])],
      setBonuses: [{ id: 'set', name: 'set', thresholds: [{ pieces: 2 + random(3), skillId: 'secret' }] }],
    })
    const input = request([skill('attack', 1 + random(4)), skill('expert', 1 + random(3))])
    const result = generateBuilds(input, data)
    let exists = false
    const bruteDecorations = (pieces, charm, available, sources = []) => {
      if (!available.length) {
        const stats = calculateBuildStats(pieces, data.weapons[0], [data.weapons[0].skills, ...pieces.map((piece) => piece.skills), charm?.skills ?? [], ...sources], data.skills, data.setBonuses)
        return input.skills.every((entry) => (stats.skills[entry.skillId]?.level ?? 0) >= entry.level)
      }
      const [size, ...rest] = available
      return [null, ...data.decorations.filter((entry) => entry.slotSize <= size)].some((entry) => bruteDecorations(pieces, charm, rest, [...sources, entry?.skills ?? []]))
    }
    const bruteArmor = (index, pieces = []) => {
      if (exists) return
      if (index === 5) {
        const available = pieces.flatMap((piece) => piece.slots.map((entry) => entry.size))
        exists = [null, ...data.charms].some((charm) => bruteDecorations(pieces, charm, available))
      } else {
        for (const piece of data.armors.filter((entry) => entry.slot === slots[index])) bruteArmor(index + 1, [...pieces, piece])
      }
    }
    bruteArmor(0)
    assert.notEqual(result.status, 'limit')
    assert.equal(result.builds.length > 0, exists, `example ${example}`)
    verify(result, input, data)
  }
})
