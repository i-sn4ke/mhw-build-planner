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
    <div className="rounded-lg border border-[#30343a] bg-[#191b1f] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9b9b95]">
        Set Bonuses
      </h2>

      {setBonuses.length === 0 ? (
        <p className="mt-3 text-sm text-[#666a70]">
          No active set bonuses.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {setBonuses.map((setBonus) => (
            <div key={setBonus.id}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#e7e4da]">
                  {setBonus.name}
                </span>

                <span className="text-sm text-[#9b9b95]">
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
                            ? 'text-[#c99a45]'
                            : 'text-[#666a70]'
                        }
                      >
                        {isActive ? '✓' : '○'}
                      </span>

                      <span
                        className={
                          isActive
                            ? 'text-[#e7e4da]'
                            : 'text-[#666a70]'
                        }
                      >
                        {threshold.pieces} pieces
                      </span>

                      <span
                        className={
                          isActive
                            ? 'text-[#9b9b95]'
                            : 'text-[#666a70]'
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