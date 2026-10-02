import type { Weapon, WeaponType } from '../types/armor'
import type { EquippedDecoration } from '../types/equipment'
import WeaponDetails from './WeaponDetails'

interface WeaponStatsPanelProps {
  weapon: Weapon | null
  decorations: EquippedDecoration[]
  onDecorationSlotSelect: (slotIndex: number) => void
  onSelectWeapon: () => void
  onClearWeapon: () => void
}

const weaponTypeNames: Record<WeaponType, string> = {
  'great-sword': 'Great Sword',
  'long-sword': 'Long Sword',
  'sword-and-shield': 'Sword & Shield',
  'dual-blades': 'Dual Blades',
  hammer: 'Hammer',
  'hunting-horn': 'Hunting Horn',
  lance: 'Lance',
  gunlance: 'Gunlance',
  'switch-axe': 'Switch Axe',
  'charge-blade': 'Charge Blade',
  'insect-glaive': 'Insect Glaive',
  'light-bowgun': 'Light Bowgun',
  'heavy-bowgun': 'Heavy Bowgun',
  bow: 'Bow',
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
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-[#e7e4da]">
                  {weapon.name}
                </p>

                <p className="mt-1 text-xs text-[#9b9b95]">
                  {weaponTypeNames[weapon.type]}
                </p>
              </div>

              <span className="rounded border border-[#454950] px-2 py-1 text-xs text-[#9b9b95]">
                Rarity {weapon.rarity}
              </span>
            </div>
          </div>

          <div className="space-y-2">
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
                {weapon.affinity > 0 ? '+' : ''}
                {weapon.affinity}%
              </span>
            </div>

            {weapon.defenseBonus !== undefined &&
              weapon.defenseBonus !== 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9b9b95]">
                    Defense Bonus
                  </span>

                  <span className="font-semibold text-[#e7e4da]">
                    {weapon.defenseBonus > 0 ? '+' : ''}
                    {weapon.defenseBonus}
                  </span>
                </div>
              )}
          </div>

          <WeaponDetails weapon={weapon} />

          <div>
            <p className="mb-2 text-sm text-[#9b9b95]">
              Slots
            </p>

            {weapon.slots.length === 0 ? (
              <span className="text-sm text-[#666a70]">
                No slots
              </span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {weapon.slots.map((slot, index) => {
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
                          : `Add decoration · Slot size ${slot.size}`
                      }
                    >
                      {equippedDecoration
                        ? equippedDecoration.decoration.name
                        : slot.size}
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
