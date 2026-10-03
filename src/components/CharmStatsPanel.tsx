import { skills } from '../data/skills'
import EquipmentIcon from './EquipmentIcon'
import type { Charm } from '../types/charm'

const skillNameById = new Map(skills.map((skill) => [skill.id, skill.name]))

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
    <div className="hunter-charm-row hunter-equipment-row border-t border-hunter-border pt-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-hunter-muted">
          Charm
        </h2>

        <div className="flex items-center gap-2">
          {charm && (
            <button
              type="button"
              onClick={onClearCharm}
              className="rounded-md px-2 py-2 text-xs text-hunter-muted transition hover:bg-hunter-hover hover:text-red-400"
              title="Remove charm"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            onClick={onSelectCharm}
            className="rounded-md border border-hunter-border px-3 py-2 text-sm text-hunter-text transition hover:border-hunter-gold"
          >
            {charm ? 'Change' : 'Select'}
          </button>
        </div>
      </div>

      {!charm ? (
        <div className="mt-2 flex items-center gap-3"><EquipmentIcon category="charm" /><p className="text-sm text-hunter-muted">No charm selected.</p></div>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-3">
            <EquipmentIcon category="charm" rarity={charm.rarity} />
            <div className="min-w-0">
            <p className="break-words font-medium text-hunter-text">
              {charm.name}
            </p>

            <p className="mt-1 text-xs text-hunter-muted">
              Rarity {charm.rarity}
            </p>
            </div>
          </div>

          {charm.skills.length > 0 && (
            <div>
              <p className="mb-2 text-sm text-hunter-muted">
                Skills
              </p>

              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {charm.skills.map((skill) => (
                  <p
                    key={skill.skillId}
                    className="text-sm text-hunter-gold"
                  >
                    {skillNameById.get(skill.skillId) ?? skill.skillId} +{skill.level}
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
