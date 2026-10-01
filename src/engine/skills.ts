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

  const activeSkillIds = new Set(
    Object.entries(totals)
      .filter(([, level]) => level > 0)
      .map(([skillId]) => skillId),
  )

  const unlockSkillByTarget = new Map<string, string>()

  skillDefinitions.forEach((definition) => {
    if (!definition.unlocksSkillId) {
      return
    }

    unlockSkillByTarget.set(
      definition.unlocksSkillId,
      definition.id,
    )
  })

  Object.entries(totals).forEach(([skillId, level]) => {
    const definition = skillDefinitions.find(
      (skill) => skill.id === skillId,
    )

    if (!definition) {
      return
    }

    let maxLevel = definition.maxLevel

    if (definition.secret) {
      const normalMaxLevel =
        definition.maxLevel - definition.secret

      const secretSkillId =
        unlockSkillByTarget.get(definition.id)

      const secretUnlocked =
        secretSkillId !== undefined &&
        activeSkillIds.has(secretSkillId)

      const inheritanceActive =
        activeSkillIds.has('inheritance')

      maxLevel =
        secretUnlocked || inheritanceActive
          ? definition.maxLevel
          : normalMaxLevel
    }

    totals[skillId] = Math.min(level, maxLevel)
  })

  return totals
}