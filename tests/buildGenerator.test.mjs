import test from 'node:test'
import assert from 'node:assert/strict'
import { generateBuilds, generateBuildsForWeaponType, generateArmorBuilds, calculateBuildStats, deserializeBuild, serializeBuild, matchesWeaponElement, matchesEquipmentSearch, catalog } from './engineLoader.mjs'

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

const bariothRequirements = () => [
  skill('agitator', 7), skill('punishing-draw', 1), skill('slugger', 3),
  skill('health-boost', 3), skill('critical-eye', 5), skill('weakness-exploit', 3),
]

test('refines the Barioth request into three distinct builds with at most three jewels', () => {
  const data = catalog()
  const input = { rank: 'master', excludeFatalis: true, skills: bariothRequirements() }
  const unrefined = generateArmorBuilds(input, data, { refine: false })
  assert.ok(unrefined.builds.some(({ build }) => build.armor.chest === '1083' && build.decorations.length === 4))
  const result = generateArmorBuilds(input, data)
  assert.equal(result.builds.length, 3)
  assert.ok(result.visitedNodes <= 200_000)
  const layouts = new Set()
  for (const candidate of result.builds) {
    assert.ok(candidate.build.decorations.length <= 3)
    const build = deserializeBuild(candidate.build, data)
    const pieces = Object.values(build.selectedArmor)
    assert.ok(pieces.every(piece => piece.rank === input.rank && piece.setBonusId !== 'fatalis-legend'))
    assert.equal(build.selectedWeapon, null)
    const stats = calculateBuildStats(pieces, null, [
      ...pieces.map(piece => piece.skills), build.selectedCharm?.skills ?? [],
      ...build.decorations.map(entry => entry.decoration.skills),
    ], data.skills, data.setBonuses)
    for (const requirement of input.skills) assert.ok(stats.skills[requirement.skillId].level >= requirement.level)
    assert.ok(stats.skills.agitator.secretUnlocked)
    assert.deepEqual(candidate.skills, stats.skills)
    assert.deepEqual(serializeBuild(build), candidate.build)
    for (const requirement of input.skills) {
      const supplied = Object.values(candidate.requiredSkillSources[requirement.skillId]).reduce((sum, value) => sum + value, 0)
      assert.ok(supplied >= requirement.level)
    }
    layouts.add(slots.map(slot => {
      const piece = build.selectedArmor[slot]
      return piece.setBonusId ?? piece.name.replace(/\s+[αβ](?:\+)?$/u, '')
    }).join('|'))
  }
  assert.equal(layouts.size, 3)
})

test('keeps Barioth when every piece from the reported build is fixed', () => {
  const data = catalog()
  const fixedArmor = { waist: '1519', arms: '1548', legs: '1520', chest: '1083', head: '1222' }
  const result = generateArmorBuilds({ rank: 'master', excludeFatalis: true, skills: bariothRequirements(), fixedArmor }, data)
  assert.equal(result.builds.length, 1)
  assert.deepEqual(result.builds[0].build.armor, fixedArmor)
  assert.equal(result.builds[0].build.decorations.length, 4)
})

test('refinement cannot replace a piece that supplies a required set threshold', () => {
  const data = database({
    skills: [definition('attack', 7), definition('draw', 1)],
    armors: slots.flatMap(slot => slot === 'chest' ? [
      armor(slot, { id: 'set-chest', setBonusId: 'set' }),
      armor(slot, { id: 'tempting-chest', skills: [skill('attack', 2)], slots: [{ size: 4 }] }),
    ] : [armor(slot, { setBonusId: slot === 'head' ? 'set' : undefined, slots: slot === 'arms' ? [{ size: 4 }] : [] })]),
    setBonuses: [{ id: 'set', name: 'Set', thresholds: [{ pieces: 2, skillId: 'draw' }] }],
    decorations: [decoration('double', 4, [skill('attack', 2)])],
  })
  const input = { ...request([skill('attack', 2), skill('draw', 1)]), fixedArmor: { head: 'head' } }
  const result = generateBuilds(input, data)
  assert.equal(result.builds[0].build.armor.chest, 'set-chest')
  verify(result, input, data)
})

test('skips a small slot when one larger jewel replaces two small jewels', () => {
  const data = database({
    armors: slots.map(slot => armor(slot, { slots: slot === 'head' ? [{ size: 1 }, { size: 4 }] : [] })),
    decorations: [decoration('single', 1, [skill('attack', 1)]), decoration('double', 4, [skill('attack', 2)])],
  })
  const input = request([skill('attack', 2)])
  const result = generateBuilds(input, data)
  assert.equal(result.builds[0].build.decorations.length, 1)
  assert.equal(result.builds[0].build.decorations[0].decorationId, 'double')
  assert.equal(result.builds[0].build.decorations[0].location.slotIndex, 1)
  assert.equal(result.optimizationComplete, true)
  verify(result, input, data)
})

test('prefers no jewels even when armor has unavoidable excess requested points', () => {
  const data = database({
    armors: slots.flatMap(slot => slot === 'head' ? [
      armor(slot, { id: 'armor-only', skills: [skill('attack', 3)] }),
      armor(slot, { id: 'needs-jewel', skills: [skill('attack', 1)], slots: [{ size: 1 }] }),
    ] : [armor(slot)]),
    decorations: [decoration('single', 1, [skill('attack', 1)])],
  })
  const result = generateBuilds(request([skill('attack', 2)]), data)
  assert.equal(result.builds[0].build.armor.head, 'armor-only')
  assert.equal(result.builds[0].build.decorations.length, 0)
  assert.equal(result.builds.length, 2)
  assert.equal(result.builds[1].build.decorations.length, 1)
})

test('reports raw requested skill contributions from each source', () => {
  const data = database({
    armors: slots.map(slot => armor(slot, { skills: slot === 'head' ? [skill('attack', 1)] : [],
      slots: slot === 'head' ? [{ size: 1 }] : [], setBonusId: slot === 'head' ? 'set' : undefined })),
    charms: [{ id: 'charm', name: 'Charm', rarity: 1, skills: [skill('attack', 1)] }],
    weapons: [weapon({ skills: [skill('attack', 1)] })],
    decorations: [decoration('single', 1, [skill('attack', 1)])],
    setBonuses: [{ id: 'set', name: 'Set', thresholds: [{ pieces: 1, skillId: 'attack' }] }],
  })
  const result = generateBuilds(request([skill('attack', 5)]), data)
  assert.deepEqual(result.builds[0].requiredSkillSources.attack, { armor: 1, charm: 1, weapon: 1, setBonus: 1, decorations: 1 })
})

test('uses the larger free slots to rank equally efficient armor', () => {
  const data = database({ armors: slots.flatMap(slot => slot === 'head' ? [
    armor(slot, { id: 'small', skills: [skill('attack', 1)], slots: [{ size: 1 }] }),
    armor(slot, { id: 'large', skills: [skill('attack', 1)], slots: [{ size: 4 }] }),
  ] : [armor(slot)]) })
  const result = generateBuilds(request(), data)
  assert.equal(result.builds[0].build.armor.head, 'large')
  assert.equal(result.builds[0].build.decorations.length, 0)
})

test('keeps a feasible build when excess above a skill cap cannot be avoided', () => {
  const data = database({
    skills: [definition('attack', 7), definition('extra', 1)],
    armors: slots.map(slot => armor(slot, { skills: slot === 'head' ? [skill('attack', 1), skill('extra', 2)] : [] })),
  })
  const result = generateBuilds(request(), data)
  assert.equal(result.builds.length, 1)
  assert.equal(result.builds[0].skills.extra.level, 1)
  assert.equal(result.builds[0].build.decorations.length, 0)
  assert.equal(result.optimizationComplete, true)
})

test('does not label a search interrupted with valid results as complete', () => {
  const data = database({ armors: slots.flatMap(slot => Array.from({ length: 3 }, (_, index) => armor(slot, {
    id: `${slot}-${index}`, name: `Family ${slot} ${index}`, skills: slot === 'head' ? [skill('attack', 1)] : [],
  }))) })
  const result = generateBuilds(request(), data, { maxNodes: 10 })
  assert.ok(result.builds.length > 0)
  assert.equal(result.status, 'limit')
  assert.equal(result.optimizationComplete, false)
  assert.ok(result.visitedNodes <= 10)
})

test('compares incidental jewel skills using the active Secret cap', () => {
  const data = database({
    armors: slots.map((slot) => armor(slot, slot === 'head'
      ? { skills: [skill('extra', 3)], slots: [{ size: 4 }] } : {})),
    skills: [definition('attack', 7), definition('extra', 5, { secret: 2 }), definition('other', 3)],
    decorations: [
      decoration('a-overcap', 4, [skill('attack', 1), skill('extra', 1)]),
      decoration('b-useful', 4, [skill('attack', 1), skill('other', 1)]),
    ],
  })
  const result = generateBuilds(request(), data)
  assert.equal(result.builds.length, 1)
  assert.equal(result.builds[0].build.decorations[0].decorationId, 'b-useful')
  verify(result, request(), data)
})

test('accepts extra Secret levels unlocked by later armor pieces', () => {
  const data = database({
    armors: slots.map((slot) => armor(slot, {
      skills: slot === 'head' ? [skill('attack', 1), skill('extra', 6)] : [],
      ...(slot === 'waist' || slot === 'legs' ? { setBonusId: 'extra-set' } : {}),
    })),
    skills: [definition('attack', 7), definition('extra', 7, { secret: 2 }),
      definition('extra-secret', 1, { unlocksSkillId: 'extra' })],
    setBonuses: [{ id: 'extra-set', name: 'Extra set', thresholds: [{ pieces: 2, skillId: 'extra-secret' }] }],
  })
  const result = generateBuilds(request(), data)
  assert.equal(result.builds.length, 1)
  assert.equal(result.builds[0].skills.extra.level, 6)
  assert.equal(result.builds[0].skills.extra.currentMaxLevel, 7)
  verify(result, request(), data)
})

test('retains unavoidable extra overfill imposed by fixed armor', () => {
  const data = database({
    armors: slots.map((slot) => armor(slot, {
      skills: slot === 'head' ? [skill('attack', 1), skill('extra', 3)]
        : slot === 'chest' ? [skill('extra', 3)] : [],
    })),
    skills: [definition('attack', 7), definition('extra', 3)],
  })
  const input = { ...request(), fixedArmor: { head: 'head', chest: 'chest' } }
  const result = generateBuilds(input, data)
  assert.equal(result.builds.length, 1)
  assert.equal(result.builds[0].skills.extra.level, 3)
  verify(result, input, data)
})

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

test('Fatalis armor is available by default and can be excluded in every generation mode', () => {
  const fatalisHead = armor('head', { id: 'fatalis-head', name: 'Test dragon armor', setBonusId: 'fatalis-legend', skills: [skill('attack', 1)] })
  const data = database({ armors: [...slots.map((slot) => armor(slot)), fatalisHead] })
  assert.equal(generateArmorBuilds({ rank: 'master', skills: [skill('attack', 1)] }, data).builds[0].build.armor.head, fatalisHead.id)
  const armorRequest = { rank: 'master', skills: [skill('attack', 1)], excludeFatalis: true }
  for (const result of [
    generateArmorBuilds(armorRequest, data),
    generateBuilds({ ...armorRequest, weaponId: 'weapon' }, data),
    generateBuildsForWeaponType({ ...armorRequest, weaponType: 'long-sword' }, data),
  ]) {
    assert.equal(result.builds.length, 0)
    assert.equal(result.status, 'exhausted')
  }
})

test('excluding Fatalis rejects fixed Fatalis armor instead of silently ignoring either constraint', () => {
  const fatalisHead = armor('head', { id: 'fatalis-head', setBonusId: 'fatalis-legend', skills: [skill('attack', 1)] })
  const data = database({ armors: [fatalisHead, ...slots.filter((slot) => slot !== 'head').map((slot) => armor(slot))] })
  const input = { rank: 'master', skills: [skill('attack', 1)], fixedArmor: { head: fatalisHead.id }, excludeFatalis: true }
  assert.throws(() => generateArmorBuilds(input, data), /fixed Fatalis armor/)
  assert.throws(() => generateBuilds({ ...input, weaponId: 'weapon' }, data), /fixed Fatalis armor/)
  assert.throws(() => generateBuildsForWeaponType({ ...input, weaponType: 'long-sword' }, data), /fixed Fatalis armor/)
})

test('excluding Fatalis does not borrow Inheritance from its set bonus', () => {
  const data = secretDatabase('inheritance')
  data.setBonuses[0].id = 'fatalis-legend'
  data.armors.push(...slots.map((slot) => armor(slot, { id: `fatalis-${slot}`, setBonusId: 'fatalis-legend' })))
  data.armors.slice(0, 5).forEach((piece) => { delete piece.setBonusId })
  const result = generateArmorBuilds({ rank: 'master', skills: [skill('attack', 7)], excludeFatalis: true }, data)
  assert.equal(result.builds.length, 0)
  assert.equal(result.status, 'exhausted')
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

test('ranks builds that avoid duplicate requested skill levels ahead of overfilled builds', () => {
  const data = database({
    skills: [definition('health', 3)],
    armors: slots.flatMap((slot) => slot === 'head'
      ? [armor(slot, { id: 'head-health-3', skills: [skill('health', 3)] }), armor(slot, { id: 'head-health-1', skills: [skill('health', 1)] })]
      : [armor(slot, { id: `${slot}-health-1`, skills: [skill('health', 1)] }), armor(slot, { id: slot })]),
  })
  const result = generateBuilds(request([skill('health', 3)]), data)
  assert.ok(result.builds.length)
  const first = deserializeBuild(result.builds[0].build, data)
  const supplied = Object.values(first.selectedArmor).reduce((total, piece) =>
    total + piece.skills.filter((entry) => entry.skillId === 'health').reduce((sum, entry) => sum + entry.level, 0), 0)
  assert.equal(supplied, 3)
})

test('armor generation keeps the most efficient variant of the same armor layout', () => {
  const data = database({
    skills: [definition('health', 3)],
    armors: slots.flatMap((slot) => [
      armor(slot, { id: `${slot}-health`, name: `Family ${slot} α+`, skills: [skill('health', 3)] }),
      armor(slot, { id: `${slot}-empty`, name: `Family ${slot} β+` }),
    ]),
  })
  const input = { rank: 'master', skills: [skill('health', 3)] }
  const result = generateArmorBuilds(input, data)
  assert.equal(result.builds.length, 1)
  const build = deserializeBuild(result.builds[0].build, data)
  assert.equal(Object.values(build.selectedArmor).flatMap((piece) => piece.skills)
    .reduce((sum, entry) => sum + entry.level, 0), 3)
})

test('real catalog: defensive skills stay exact with and without Fatalis armor', () => {
  const data = catalog()
  const input = { rank: 'master', skills: [
    skill('blast-resistance', 3), skill('health-boost', 3),
    skill('evade-extender', 3), skill('evade-window', 5),
  ] }
  const fixedHeadId = data.armors.find((piece) => piece.name === 'Uragaan Helm β+').id
  for (const excludeFatalis of [false, true]) {
    for (const fixedArmor of [undefined, { head: fixedHeadId }]) {
      const result = generateArmorBuilds({ ...input, excludeFatalis, fixedArmor }, data)
      assert.equal(result.builds.length, 3, result.status)
      for (const candidate of result.builds) {
        const build = deserializeBuild(candidate.build, data)
        if (excludeFatalis) assert.ok(Object.values(build.selectedArmor).every((piece) => piece.setBonusId !== 'fatalis-legend'))
        if (fixedArmor) assert.equal(build.selectedArmor.head.id, fixedHeadId)
        const sources = [
          ...Object.values(build.selectedArmor).map((piece) => piece.skills),
          build.selectedCharm?.skills ?? [], ...build.decorations.map((entry) => entry.decoration.skills),
        ]
        for (const requirement of input.skills) {
          const rawLevel = sources.flat().filter((entry) => entry.skillId === requirement.skillId)
            .reduce((sum, entry) => sum + entry.level, 0)
          assert.equal(rawLevel, requirement.level, `${requirement.skillId}: ${JSON.stringify(candidate.build.armor)}`)
          assert.equal(candidate.skills[requirement.skillId].level, requirement.level)
        }
      }
    }
  }
})

test('keeps unavoidable overfill from fixed armor while avoiding additional duplicates', () => {
  const data = database({
    skills: [definition('health', 3)],
    armors: slots.flatMap((slot) => [
      armor(slot, { id: `${slot}-health`, skills: [skill('health', 3)] }), armor(slot),
    ]),
  })
  const result = generateArmorBuilds({
    rank: 'master', skills: [skill('health', 3)], fixedArmor: { head: 'head-health', chest: 'chest-health' },
  }, data)
  assert.ok(result.builds.length)
  for (const candidate of result.builds) {
    const build = deserializeBuild(candidate.build, data)
    assert.equal(build.selectedArmor.head.id, 'head-health')
    assert.equal(build.selectedArmor.chest.id, 'chest-health')
    assert.equal(Object.values(build.selectedArmor).flatMap((piece) => piece.skills)
      .reduce((sum, entry) => sum + entry.level, 0), 6)
    assert.equal(candidate.skills.health.level, 3)
  }
})

test('prefers exact decoration levels over jewels that repeat an already satisfied skill', () => {
  const data = database({
    skills: [definition('health', 3), definition('evasion', 5)],
    armors: slots.map((slot) => armor(slot, {
      skills: slot === 'head' ? [skill('health', 3)] : [],
      slots: slot === 'head' ? [{ size: 4 }] : [],
    })),
    decorations: [
      decoration('a-combined', 4, [skill('health', 1), skill('evasion', 1)]),
      decoration('b-double', 2, [skill('evasion', 2)]),
      decoration('c-single', 2, [skill('evasion', 1)]),
    ],
  })
  const result = generateArmorBuilds({ rank: 'master', skills: [skill('health', 3), skill('evasion', 1)] }, data)
  assert.equal(result.builds.length, 1)
  assert.deepEqual(result.builds[0].build.decorations.map((entry) => entry.decorationId), ['c-single'])
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


test('armor generation cannot borrow weapon skills, slots or set bonuses', () => {
  const data = database({
    weapons: [weapon({ skills: [skill('attack', 7)], slots: [{ size: 4 }], setBonusId: 'set' })],
    armors: slots.map(slot => armor(slot, { setBonusId: slot === 'head' ? 'set' : undefined })),
    decorations: [decoration('attack-jewel', 1, [skill('attack', 1)])],
    setBonuses: [{ id: 'set', name: 'set', thresholds: [{ pieces: 2, skillId: 'attack' }] }],
  })
  const result = generateArmorBuilds({ rank: 'master', skills: [skill('attack', 1)] }, data)
  assert.equal(result.builds.length, 0)
  assert.equal(result.status, 'exhausted')
})

test('armor generation returns fewer results rather than alpha/beta duplicates', () => {
  const data = database({
    weapons: [],
    armors: slots.flatMap(slot => ['α+', 'β+'].map(variant => armor(slot, {
      id: `${slot}-${variant}`, name: `Family ${slot} ${variant}`, skills: [skill('attack', 1)],
    }))),
  })
  const result = generateArmorBuilds({ rank: 'master', skills: [skill('attack', 5)], fixedArmor: { head: 'head-β+' } }, data)
  assert.equal(result.builds.length, 1)
  assert.equal(result.builds[0].build.weaponId, null)
  assert.equal(result.builds[0].build.armor.head, 'head-β+')
  assert.equal(result.builds[0].skills.attack.level, 5)
})

test('real catalog: armor-only variants satisfy skills and Secret caps independently', () => {
  const data = catalog()
  const input = { rank: 'master', skills: [skill('agitator', 7), skill('critical-eye', 7), skill('weakness-exploit', 3)] }
  const result = generateArmorBuilds(input, data)
  assert.ok(result.builds.length, result.status)
  const layouts = new Set()
  for (const candidate of result.builds) {
    const build = deserializeBuild(candidate.build, data)
    assert.equal(build.selectedWeapon, null)
    assert.ok(build.decorations.every(entry => entry.location.type === 'armor'))
    const pieces = Object.values(build.selectedArmor)
    const stats = calculateBuildStats(pieces, null, [
      ...pieces.map(piece => piece.skills), build.selectedCharm?.skills ?? [],
      ...build.decorations.map(entry => entry.decoration.skills),
    ], data.skills, data.setBonuses)
    for (const required of input.skills) assert.ok(stats.skills[required.skillId].level >= required.level)
    assert.ok(stats.skills.agitator.secretUnlocked)
    assert.deepEqual(candidate.skills, stats.skills)
    layouts.add(slots.map(slot => {
      const piece = build.selectedArmor[slot]
      return `${slot}:${piece.setBonusId ?? piece.name.replace(/\s+[αβ](?:\+)?$/u, '')}`
    }).join('|'))
  }
  assert.equal(layouts.size, result.builds.length)
})


test('armor-only sampling explores earlier slots instead of only swapping legs', () => {
  const data = catalog()
  const result = generateArmorBuilds({ rank: 'master', skills: [skill('critical-eye', 7)] }, data)
  assert.equal(result.builds.length, 3)
  const byId = new Map(data.armors.map(piece => [piece.id, piece]))
  const layouts = result.builds.map(({ build }) => slots.map(slot => {
    const piece = byId.get(build.armor[slot])
    return piece.setBonusId ?? piece.name.replace(/\s+[αβ](?:\+)?$/u, '')
  }))
  for (let a = 0; a < layouts.length; a++) {
    for (let b = a + 1; b < layouts.length; b++) {
      assert.ok(layouts[a].filter((family, index) => family !== layouts[b][index]).length >= 2)
    }
  }
})
