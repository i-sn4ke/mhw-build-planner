import type { ActiveSetBonus } from '../engine/setBonuses'
import type { SkillDefinition } from '../types/skillDefinition'

interface SetBonusPanelProps {
  setBonuses: ActiveSetBonus[]
  skills: SkillDefinition[]
}

function SetBonusPanel({
  setBonuses,
  skills,
}: SetBonusPanelProps) {
  const getSkillName = (skillId: string) => {
    return (
      skills.find((skill) => skill.id === skillId)?.name ??
      skillId
    )
  }

  return (
    <div className="hunter-panel hunter-set-bonuses rounded-lg border border-hunter-border bg-hunter-panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-hunter-muted">
        Set Bonuses
      </h2>

      {setBonuses.length === 0 ? (
        <p className="mt-3 text-sm text-hunter-muted">
          No active set bonuses.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {setBonuses.map((setBonus) => (
            <div key={setBonus.id}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-hunter-text">
                  {setBonus.name}
                </span>

                <span className="text-sm text-hunter-muted">
                  {setBonus.pieces} pieces
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {setBonus.thresholds.map((threshold) => {
                  const isActive =
                    setBonus.pieces >= threshold.pieces

                  return (
                    <div
                      key={`${setBonus.id}-${threshold.pieces}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className={
                          isActive
                            ? 'text-hunter-gold'
                            : 'text-hunter-muted'
                        }
                      >
                        {isActive ? '✓' : '○'}
                      </span>

                      <span
                        className={
                          isActive
                            ? 'text-hunter-text'
                            : 'text-hunter-muted'
                        }
                      >
                        {threshold.pieces} pieces
                      </span>

                      <span
                        className={
                          isActive
                            ? 'text-hunter-muted'
                            : 'text-hunter-muted'
                        }
                      >
                        {getSkillName(threshold.skillId)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SetBonusPanel
