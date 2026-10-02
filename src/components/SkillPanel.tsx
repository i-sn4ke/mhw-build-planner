import { skills as skillDefinitions } from '../data/skills'
import type { CalculatedSkills } from '../types/calculatedSkill'
import SkillTooltip from './SkillTooltip'

interface SkillPanelProps {
  skills: CalculatedSkills
}

function SkillPanel({ skills }: SkillPanelProps) {
  const entries = Object.entries(skills)

  const skillDefinitionById = new Map(
    skillDefinitions.map((skill) => [skill.id, skill]),
  )

  return (
    <div className="rounded-lg border border-[#30343a] bg-[#191b1f] p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9b9b95]">
          Skills
        </h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-[#666a70]">
          No skills yet.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map(([skillId, calculatedSkill]) => {
            const definition =
              skillDefinitionById.get(skillId)

            const hasSecretLevels =
              definition?.secret !== undefined &&
              definition.secret > 0

            const secretLocked =
              hasSecretLevels &&
              !calculatedSkill.secretUnlocked

            const secretUnlocked =
              hasSecretLevels &&
              calculatedSkill.secretUnlocked

            return (
              <div
                key={skillId}
                className="rounded-md bg-[#15171a] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-4">
                  {definition ? (
                    <SkillTooltip definition={definition} level={calculatedSkill.level} className="text-sm text-[#e7e4da]" />
                  ) : <span className="text-sm text-[#e7e4da]">{skillId}</span>}

                  <span className="text-sm font-semibold text-[#c99a45]">
                    Lv {calculatedSkill.level} /{' '}
                    {calculatedSkill.currentMaxLevel}
                  </span>
                </div>

                {secretLocked && (
                  <div className="mt-1 text-xs text-[#777b82]">
                    🔒 Secret cap:{' '}
                    {calculatedSkill.absoluteMaxLevel}
                  </div>
                )}

                {secretUnlocked && (
                  <div className="mt-1 text-xs text-[#c99a45]">
                    🔓 Secret unlocked
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SkillPanel
