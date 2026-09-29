import type { Charm } from '../types/charm'
import type { EquippedDecoration } from '../types/equipment'

interface CharmStatsPanelProps {
  charm: Charm | null
  decorations: EquippedDecoration[]
  onDecorationSlotSelect: (slotIndex: number) => void
  onSelectCharm: () => void
  onClearCharm: () => void
}

function CharmStatsPanel({
  charm,
  decorations,
  onDecorationSlotSelect,
  onSelectCharm,
  onClearCharm,
}: CharmStatsPanelProps) {
  const getDecoration = (slotIndex: number) =>
    decorations.find(
      (equipped) =>
        equipped.location.type === 'charm' &&
        equipped.location.slotIndex === slotIndex,
    )

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

          <div>
            <p className="mb-2 text-sm text-[#9b9b95]">
              Slots
            </p>

            {charm.slots.length === 0 ? (
              <span className="text-sm text-[#666a70]">
                No slots
              </span>
            ) : (
              <div className="flex gap-1">
                {charm.slots.map((size, index) => {
                  const equippedDecoration =
                    getDecoration(index)

                  return (
                    <button
                      key={`${charm.id}-${index}`}
                      type="button"
                      onClick={() =>
                        onDecorationSlotSelect(index)
                      }
                      className="flex min-h-7 min-w-7 items-center justify-center rounded border border-[#454950] px-2 text-xs transition hover:border-[#c99a45] hover:bg-[#25282d] hover:text-[#c99a45]"
                      title={
                        equippedDecoration
                          ? `Change ${equippedDecoration.decoration.name}`
                          : `Add decoration · Slot size ${size.size}`
                      }
                    >
                      {equippedDecoration
                        ? equippedDecoration.decoration.name
                        : size.size}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CharmStatsPanel