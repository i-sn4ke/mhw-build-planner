import { skills as skillDefinitions } from '../data/skills'

interface SkillPanelProps {
  skills: Record<string, number>
}


function SkillPanel({ skills }: SkillPanelProps) {
  const entries = Object.entries(skills)

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
          {entries.map(([skillId, level]) => (
            <div
              key={skillId}
              className="flex items-center justify-between rounded-md bg-[#15171a] px-3 py-2"
            >
              <span className="text-sm text-[#e7e4da]">
                {skillDefinitions.find((skill) => skill.id === skillId)?.name ??
                  skillId}
              </span>

              <span className="text-sm font-semibold text-[#c99a45]">
                  Lv {level} /{' '}
                  {skillDefinitions.find((skill) => skill.id === skillId)?.maxLevel ??
                    level}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SkillPanel