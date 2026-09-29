import type { Charm } from '../types/charm'

interface CharmStatsPanelProps {
  charm: Charm | null
  onSelectCharm: () => void
  onClearCharm: () => void
}

function CharmStatsPanel({
  charm,
  onSelectCharm,
  onClearCharm,
}: CharmStatsPanelProps) {
  return (
    <div className="rounded-lg border border-[#30343a] bg-[#191b1f] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9b9b95]">
          Charm
        </h2>

        <div className="flex items-center gap-2">
          {charm && (
            <button
              type="button"
              onClick={onClearCharm}
              className="rounded-md px-2 py-2 text-xs text-[#666a70] transition hover:bg-[#25282d] hover:text-red-400"
              title="Remove charm"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            onClick={onSelectCharm}
            className="rounded-md border border-[#30343a] px-3 py-2 text-sm text-[#e7e4da] transition hover:border-[#c99a45]"
          >
            {charm ? 'Change' : 'Select'}
          </button>
        </div>
      </div>

      {!charm ? (
        <p className="mt-4 text-sm text-[#666a70]">
          No charm selected.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <p className="font-medium text-[#e7e4da]">
              {charm.name}
            </p>

            <p className="mt-1 text-xs text-[#666a70]">
              Rarity {charm.rarity}
            </p>
          </div>

          {charm.skills.length > 0 && (
            <div>
              <p className="mb-2 text-sm text-[#9b9b95]">
                Skills
              </p>

              <div className="space-y-1">
                {charm.skills.map((skill) => (
                  <p
                    key={skill.skillId}
                    className="text-sm text-[#c99a45]"
                  >
                    {skill.skillId} +{skill.level}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CharmStatsPanel