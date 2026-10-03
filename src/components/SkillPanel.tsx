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
    <div className="hunter-panel hunter-skills rounded-lg border border-hunter-border bg-hunter-panel p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-hunter-muted">
          Skills
        </h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-hunter-muted">
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
                className="hunter-skill-row rounded-md bg-hunter-inset px-3 py-2"
              >
                <div className="flex items-center justify-between gap-4">
                  {definition ? (
                    <SkillTooltip definition={definition} level={calculatedSkill.level} className="text-sm text-hunter-text" />
                  ) : <span className="text-sm text-hunter-text">{skillId}</span>}

                  <span className="shrink-0 text-sm font-semibold text-hunter-gold">
                    Lv {calculatedSkill.level} /{' '}
                    {calculatedSkill.currentMaxLevel}
                  </span>
                </div>
                <div className="hunter-levels mt-2" aria-hidden="true">
                  {Array.from({ length: calculatedSkill.currentMaxLevel }, (_, index) => (
                    <span key={index} className={index < calculatedSkill.level ? 'hunter-level-filled' : ''} />
                  ))}
                </div>

                {secretLocked && (
                  <div className="mt-1 text-xs text-hunter-muted">
                    🔒 Secret cap:{' '}
                    {calculatedSkill.absoluteMaxLevel}
                  </div>
                )}

                {secretUnlocked && (
                  <div className="mt-1 text-xs text-hunter-gold">
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
