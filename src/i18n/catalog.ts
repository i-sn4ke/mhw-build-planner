import italian from './generated/it.json'
import overrides from './overrides-it.json'
import supplemental from './kiranico-it.json'
import armor from '../data/generated/armor.json'
import weapons from '../data/generated/weapons.json'
import charms from '../data/generated/charms.json'
import decorations from '../data/generated/decorations.json'
import skills from '../data/generated/skills.json'
import setBonuses from '../data/generated/setBonuses.json'
import damage from '../data/generated/damageSimulation.json'
import { bilingualSearchText } from './translate'

const texts: Record<string, string> = {}
function addNames(entries: { id: string; name: string }[], translations: Record<string, { name?: string }>) {
  for (const entry of entries) {
    const name = translations[entry.id]?.name
    if (name) texts[entry.name] = name
  }
}
const translatedSkills: Record<string, { name?: string; description?: string; levels?: Record<string, string> }> = { ...italian.skills, ...supplemental.skills }
for (const [id, entry] of Object.entries(overrides.skills)) {
  translatedSkills[id] = { ...translatedSkills[id], ...entry }
}
addNames(armor, { ...italian.armor, ...supplemental.armor })
addNames(weapons, { ...italian.weapons, ...supplemental.weapons })
addNames(charms, { ...italian.charms, ...supplemental.charms })
addNames(decorations, { ...italian.decorations, ...supplemental.decorations })
addNames(skills, translatedSkills)
addNames(setBonuses, { ...italian.setBonuses, ...supplemental.setBonuses, ...overrides.setBonuses })
addNames(damage.monsters, italian.monsters)
for (const skill of skills) {
  const translated = translatedSkills[skill.id]
  if (translated?.description && skill.description) texts[skill.description] = translated.description
  for (const level of skill.levels) {
    const description = translated?.levels?.[level.level]
    if (description && level.description) texts[level.description] = description
  }
}
export const gameTexts = texts
export const getSearchText = (name: string) => bilingualSearchText(name, gameTexts)
