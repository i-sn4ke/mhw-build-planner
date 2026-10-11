import test from 'node:test'
import assert from 'node:assert/strict'
import { catalog, generateArmorBuilds, deserializeBuild, calculateBuildStats } from './engineLoader.mjs'

const data = catalog()
const profiles = {
  offense: [['attack-boost', 7], ['critical-eye', 7], ['weakness-exploit', 3], ['critical-boost', 3]],
  comfort: [['health-boost', 3], ['divine-blessing', 3], ['stun-resistance', 3]],
  evasion: [['evade-window', 5], ['evade-extender', 3], ['speed-eating', 3]],
  disruption: [['earplugs', 5], ['tremor-resistance', 3], ['windproof', 5]],
  guarding: [['guard', 5], ['guard-up', 1], ['offensive-guard', 3]],
  stamina: [['constitution', 5], ['stamina-surge', 3], ['marathon-runner', 3]],
  element: [['fire-attack', 6], ['critical-element', 1], ['weakness-exploit', 3]],
  sharpness: [['handicraft', 5], ['protective-polish', 1], ['speed-sharpening', 3]],
  support: [['free-meal', 3], ['wide-range', 5], ['speed-eating', 3]],
  artillery: [['artillery', 5], ['focus', 3], ['capacity-boost', 1]],
  secrets: [['agitator', 7], ['maximum-might', 5], ['critical-eye', 7], ['weakness-exploit', 3]],
  draw: [['critical-draw', 3], ['punishing-draw', 1], ['frostcraft', 1], ['health-boost', 3]],
  ailments: [['blight-resistance', 3], ['poison-resistance', 3], ['paralysis-resistance', 3], ['sleep-resistance', 3]],
  partial: [['attack-boost', 4], ['critical-eye', 4], ['health-boost', 1], ['evade-window', 2]],
  normalCaps: [['divine-blessing', 3], ['agitator', 5], ['maximum-might', 3]],
}

function rawSkillTotals(build) {
  const pieces = Object.values(build.selectedArmor)
  const totals = {}
  const sources = [...pieces.map((piece) => piece.skills), build.selectedCharm?.skills ?? [],
    ...build.decorations.map((entry) => entry.decoration.skills)]
  for (const source of sources) {
    for (const entry of source) totals[entry.skillId] = (totals[entry.skillId] ?? 0) + entry.level
  }
  for (const set of data.setBonuses) {
    const count = pieces.filter((piece) => piece.setBonusId === set.id).length
    for (const threshold of set.thresholds) {
      if (count >= threshold.pieces) totals[threshold.skillId] = (totals[threshold.skillId] ?? 0) + 1
    }
  }
  return totals
}

function verifyCandidate(candidate, skills, excludeFatalis) {
  const build = deserializeBuild(candidate.build, data)
  const pieces = Object.values(build.selectedArmor)
  if (excludeFatalis) assert.ok(pieces.every((piece) => piece.setBonusId !== 'fatalis-legend'))
  for (const requirement of skills) {
    assert.ok(candidate.skills[requirement.skillId].level >= requirement.level)
  }
  // Check every skill, including extras, against its currently unlocked cap.
  for (const [skillId, rawLevel] of Object.entries(rawSkillTotals(build))) {
    assert.ok(rawLevel <= candidate.skills[skillId].currentMaxLevel,
      `${skillId}: ${rawLevel} > ${candidate.skills[skillId].currentMaxLevel}; ${pieces.map((piece) => piece.name).join(', ')}`)
  }
  // No jewel should occupy a slot while contributing nothing to the request.
  for (let index = 0; index < build.decorations.length; index++) {
    const retained = build.decorations.filter((_, otherIndex) => otherIndex !== index)
    const stats = calculateBuildStats(pieces, null, [...pieces.map((piece) => piece.skills),
      build.selectedCharm?.skills ?? [], ...retained.map((entry) => entry.decoration.skills)], data.skills, data.setBonuses)
    assert.ok(skills.some((entry) => (stats.skills[entry.skillId]?.level ?? 0) < entry.level),
      `Unnecessary jewel: ${build.decorations[index].decoration.name}`)
  }
}

for (const [name, requirements] of Object.entries(profiles)) {
  for (const excludeFatalis of [false, true]) {
    test(`real catalog redundancy: ${name}, Fatalis ${excludeFatalis ? 'excluded' : 'allowed'}`, () => {
      const skills = requirements.map(([skillId, level]) => ({ skillId, level }))
      const result = generateArmorBuilds({ rank: 'master', skills, excludeFatalis }, data)
      assert.ok(result.builds.length > 0 && result.builds.length <= 3, result.status)
      for (const candidate of result.builds) verifyCandidate(candidate, skills, excludeFatalis)
    })
  }
}

// A fixed seed makes any failure reproducible and keeps the inputs stable.
test('100 seeded requests across low, high and master ranks avoid redundant points and jewels', () => {
  const pool = [
    'attack-boost', 'critical-eye', 'weakness-exploit', 'critical-boost', 'health-boost', 'stun-resistance',
    'divine-blessing', 'earplugs', 'windproof', 'tremor-resistance', 'evade-window', 'evade-extender',
    'constitution', 'stamina-surge', 'marathon-runner', 'guard', 'offensive-guard', 'wide-range',
    'speed-eating', 'recovery-up', 'recovery-speed', 'quick-sheath', 'speed-sharpening', 'focus',
    'power-prolonger', 'partbreaker', 'blight-resistance', 'fire-resistance', 'poison-resistance',
    'paralysis-resistance', 'sleep-resistance',
  ]
  let seed = 261011
  const random = (count) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed % count
  }
  const feasibleLowRequests = new Set([4, 24, 52, 68, 88])
  for (let index = 0; index < 100; index++) {
    const rank = ['low', 'high', 'master', 'master'][index % 4]
    const excludeFatalis = index % 4 === 3
    const chosen = new Set()
    while (chosen.size < 3) chosen.add(pool[random(pool.length)])
    const skills = [...chosen].map((skillId) => {
      const definition = data.skills.find((entry) => entry.id === skillId)
      return { skillId, level: Math.max(1, definition.maxLevel - (definition.secret ?? 0) - random(2)) }
    })
    const result = generateArmorBuilds({ rank, skills, excludeFatalis }, data)
    const context = JSON.stringify({ index, rank, skills, excludeFatalis })
    assert.ok(result.builds.length <= 3, context)
    assert.notEqual(result.status, 'limit', context)
    if (rank !== 'low' || feasibleLowRequests.has(index)) assert.ok(result.builds.length > 0, context)
    for (const candidate of result.builds) verifyCandidate(candidate, skills, excludeFatalis)
  }
})
