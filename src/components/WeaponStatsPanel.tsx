import type { Weapon } from '../types/armor'
import type { EquippedDecoration } from '../types/equipment'

interface WeaponStatsPanelProps {
  weapon: Weapon | null
  decorations: EquippedDecoration[]
  onDecorationSlotSelect: (slotIndex: number) => void
  onSelectWeapon: () => void
  onClearWeapon: () => void
}

function WeaponStatsPanel({
  weapon,
  decorations,
  onDecorationSlotSelect,
  onSelectWeapon,
  onClearWeapon,
}: WeaponStatsPanelProps) {
  const getDecoration = (slotIndex: number) =>
    decorations.find(
      (equipped) =>
        equipped.location.type === 'weapon' &&
        equipped.location.slotIndex === slotIndex,
    )

  return (
    <div className="rounded-lg border border-[#30343a] bg-[#191b1f] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9b9b95]">
          Weapon
        </h2>

        <div className="flex items-center gap-2">
          {weapon && (
            <button
              type="button"
              onClick={onClearWeapon}
              className="rounded-md px-2 py-2 text-xs text-[#666a70] transition hover:bg-[#25282d] hover:text-red-400"
              title="Remove weapon"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            onClick={onSelectWeapon}
            className="rounded-md border border-[#30343a] px-3 py-2 text-sm text-[#e7e4da] transition hover:border-[#c99a45]"
          >
            {weapon ? 'Change' : 'Select'}
          </button>
        </div>
      </div>

      {!weapon ? (
        <p className="mt-4 text-sm text-[#666a70]">
          No weapon selected.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <p className="font-medium text-[#e7e4da]">
              {weapon.name}
            </p>

            <p className="mt-1 text-xs text-[#9b9b95]">
              {weapon.type}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9b9b95]">
              Attack
            </span>

            <span className="font-semibold text-[#e7e4da]">
              {weapon.attack}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9b9b95]">
              Affinity
            </span>

            <span className="font-semibold text-[#e7e4da]">
              {weapon.affinity}%
            </span>
          </div>

          <div>
            <p className="mb-2 text-sm text-[#9b9b95]">
              Slots
            </p>

            {weapon.slots.length === 0 ? (
              <span className="text-sm text-[#666a70]">
                No slots
              </span>
            ) : (
              <div className="flex gap-1">
                {weapon.slots.map((size, index) => {
                  const equippedDecoration =
                    getDecoration(index)

                  return (
                    <button
                      key={`${weapon.id}-${index}`}
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

export default WeaponStatsPanel