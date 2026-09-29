import type {
  ArmorPiece,
  ArmorSlot as ArmorSlotType,
} from '../types/armor'

import type { EquippedDecoration } from '../types/equipment'

interface ArmorSlotProps {
  slot: ArmorSlotType
  armor?: ArmorPiece
  decorations: EquippedDecoration[]
  onSelect: () => void
  onClear: () => void
  onDecorationSlotSelect: (slotIndex: number) => void
}

const slotNames: Record<ArmorSlotType, string> = {
  head: 'Head',
  chest: 'Chest',
  arms: 'Arms',
  waist: 'Waist',
  legs: 'Legs',
}

function ArmorSlot({
  slot,
  armor,
  decorations,
  onSelect,
  onClear,
  onDecorationSlotSelect,
}: ArmorSlotProps) {
  const getDecoration = (slotIndex: number) =>
    decorations.find(
      (equipped) =>
        equipped.location.type === 'armor' &&
        equipped.location.slot === slot &&
        equipped.location.slotIndex === slotIndex,
    )

  return (
    <div className="rounded-lg border border-[#30343a] bg-[#191b1f] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9b9b95]">
          {slotNames[slot]}
        </h3>
        {armor && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-1 text-xs text-[#666a70] transition hover:bg-[#25282d] hover:text-red-400"
            title={`Remove ${slotNames[slot]}`}
          >
            ✕
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="w-full rounded-md border border-dashed border-[#454950] bg-[#15171a] p-5 text-left transition hover:border-[#c99a45] hover:bg-[#1d2024]"
      >
        {armor ? (
          <div>
            <p className="font-semibold text-[#e7e4da]">
              {armor.name}
            </p>

            <p className="mt-1 text-xs text-[#9b9b95]">
              Rarity {armor.rarity} · {armor.rank} rank
            </p>

            {armor.skills.length > 0 && (
              <div className="mt-3 space-y-1">
                {armor.skills.map((skill) => (
                  <p
                    key={skill.skillId}
                    className="text-sm text-[#c99a45]"
                  >
                    {skill.skillId} +{skill.level}
                  </p>
                ))}
              </div>
            )}

            {armor.slots.length > 0 && (
              <div className="mt-3 flex gap-1">
                {armor.slots.map((size, index) => {
                  const equippedDecoration =
                    getDecoration(index)

                  return (
                    <button
                      key={`${armor.id}-${index}`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDecorationSlotSelect(index)
                      }}
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
        ) : (
          <div className="flex min-h-24 items-center justify-center">
            <span className="text-sm text-[#666a70]">
              Select armor...
            </span>
          </div>
        )}
      </button>
    </div>
  )
}

export default ArmorSlot