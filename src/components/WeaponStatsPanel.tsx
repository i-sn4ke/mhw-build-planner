import type { Weapon, WeaponType } from '../types/armor'
import type { EquippedDecoration } from '../types/equipment'
import WeaponDetails from './WeaponDetails'
import EquipmentIcon from './EquipmentIcon'

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
    <div className="hunter-weapon-row pb-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-hunter-muted">
          Weapon
        </h2>

        <div className="flex items-center gap-2">
          {weapon && (
            <button
              type="button"
              onClick={onClearWeapon}
              className="rounded-md px-2 py-2 text-xs text-hunter-muted transition hover:bg-hunter-hover hover:text-red-400"
              title="Remove weapon"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            onClick={onSelectWeapon}
            className="rounded-md border border-hunter-border px-3 py-2 text-sm text-hunter-text transition hover:border-hunter-gold"
          >
            {weapon ? 'Change' : 'Select'}
          </button>
        </div>
      </div>

      {!weapon ? (
        <p className="mt-4 text-sm text-hunter-muted">
          No weapon selected.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <EquipmentIcon category={weapon.type} rarity={weapon.rarity} />
                <div className="min-w-0">
                <p className="break-words font-medium text-hunter-text">
                  {weapon.name}
                </p>

                <p className="mt-1 text-xs text-hunter-muted">
                  {weaponTypeNames[weapon.type]}
                </p>
                </div>
              </div>

              <span className="rounded border border-hunter-trim px-2 py-1 text-xs text-hunter-muted">
                Rarity {weapon.rarity}
              </span>
            </div>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-hunter-muted">Weapon details</summary>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-hunter-muted">
                Attack
              </span>

              <span className="font-semibold text-hunter-text">
                {weapon.attack}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-hunter-muted">
                Affinity
              </span>

              <span className="font-semibold text-hunter-text">
                {weapon.affinity > 0 ? '+' : ''}
                {weapon.affinity}%
              </span>
            </div>

            {weapon.defenseBonus !== undefined &&
              weapon.defenseBonus !== 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-hunter-muted">
                    Defense Bonus
                  </span>

                  <span className="font-semibold text-hunter-text">
                    {weapon.defenseBonus > 0 ? '+' : ''}
                    {weapon.defenseBonus}
                  </span>
                </div>
              )}
          </div>

          <WeaponDetails weapon={weapon} />

          </details>

          <div>
            <p className="mb-2 text-sm text-hunter-muted">
              Slots
            </p>

            {weapon.slots.length === 0 ? (
              <span className="text-sm text-hunter-muted">
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
                      className="flex min-h-8 min-w-8 max-w-full break-words items-center justify-center rounded border border-hunter-trim px-2 text-xs transition hover:border-hunter-gold hover:bg-hunter-hover hover:text-hunter-gold"
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
