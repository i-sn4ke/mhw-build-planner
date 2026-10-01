import type { ArmorSkill } from '../types/skill'
import type { SkillDefinition } from '../types/skillDefinition'
import type { CalculatedSkills } from '../types/calculatedSkill'

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
): CalculatedSkills {
  const totals: Record<string, number> = {}

  skillSources.forEach((skills) => {
    addSkills(totals, skills)
  })

  const skillDefinitionById = new Map(
    skillDefinitions.map((skill) => [skill.id, skill]),
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

  const activeSkillIds = new Set(
    Object.entries(totals)
      .filter(([, level]) => level > 0)
      .map(([skillId]) => skillId),
  )

  const inheritanceActive =
    activeSkillIds.has('inheritance')

  const calculatedSkills: CalculatedSkills = {}

  Object.entries(totals).forEach(([skillId, rawLevel]) => {
    const definition =
      skillDefinitionById.get(skillId)

    if (!definition) {
      return
    }

    const absoluteMaxLevel = definition.maxLevel

    let currentMaxLevel = absoluteMaxLevel
    let secretUnlocked = false

    if (definition.secret) {
      const normalMaxLevel =
        absoluteMaxLevel - definition.secret

      const secretSkillId =
        unlockSkillByTarget.get(skillId)

      const individualSecretUnlocked =
        secretSkillId !== undefined &&
        activeSkillIds.has(secretSkillId)

      secretUnlocked =
        individualSecretUnlocked ||
        inheritanceActive

      currentMaxLevel = secretUnlocked
        ? absoluteMaxLevel
        : normalMaxLevel
    }

    calculatedSkills[skillId] = {
      level: Math.min(rawLevel, currentMaxLevel),
      currentMaxLevel,
      absoluteMaxLevel,
      secretUnlocked,
    }
  })

  return calculatedSkills
}