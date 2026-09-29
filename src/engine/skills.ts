import type { ArmorSkill } from '../types/skill'
import type { SkillDefinition } from '../types/skillDefinition'

export function addSkills(
  totals: Record<string, number>,
  skills: ArmorSkill[],
) {
  skills.forEach(({ skillId, level }) => {
    totals[skillId] = (totals[skillId] ?? 0) + level
  })
}

export function calculateSkillTotals(
  skillSources: ArmorSkill[][],
  skillDefinitions: SkillDefinition[],
): Record<string, number> {
  const totals: Record<string, number> = {}

  skillSources.forEach((skills) => {
    addSkills(totals, skills)
  })

  Object.entries(totals).forEach(([skillId, level]) => {
    const definition = skillDefinitions.find(
      (skill) => skill.id === skillId,
    )

    if (definition) {
      totals[skillId] = Math.min(
        level,
        definition.maxLevel,
      )
    }
  })

  return totals
}