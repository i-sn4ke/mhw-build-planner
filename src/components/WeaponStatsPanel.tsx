import { useTranslation } from '../i18n/useTranslation'
import EquipmentSkillList from './EquipmentSkillList'
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
  const { t } = useTranslation()
  const getDecoration = (slotIndex: number) =>
    decorations.find(
      (equipped) =>
        equipped.location.type === 'weapon' &&
        equipped.location.slotIndex === slotIndex,
    )

  return (
    <div className="hunter-weapon-row hunter-item-row pb-3">
      <EquipmentIcon category={weapon?.type ?? 'great-sword'} rarity={weapon?.rarity} onSelect={onSelectWeapon} />
      {weapon && <button type="button" onClick={onClearWeapon} aria-label={t("Remove weapon")} title={t("Remove weapon")} className="hunter-slot-remove text-xs text-hunter-muted hover:text-red-400">✕</button>}
      {!weapon ? (
        <p className="hunter-slot-content hunter-slot-empty text-sm text-hunter-muted">{' '}{t("No weapon selected.")}{' '}</p>
      ) : (
        <div className="hunter-slot-content space-y-2">
          <div>
            <div className="hunter-item-summary flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                <p className="break-words font-medium text-hunter-text">
                  {t(weapon.name)}
                </p>

                <p className="mt-1 text-xs text-hunter-muted">
                  {t(weaponTypeNames[weapon.type])} {t("· Rarity")} {weapon.rarity}
                </p>
                </div>
              </div>


            </div>
          </div>

          <EquipmentSkillList skills={weapon.skills} />
          <details className="text-xs">
            <summary className="cursor-pointer text-hunter-muted">{t("Weapon details")}</summary>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-hunter-muted">{' '}{t("Attack")}{' '}</span>

              <span className="font-semibold text-hunter-text">
                {weapon.attack}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-hunter-muted">{' '}{t("Affinity")}{' '}</span>

              <span className="font-semibold text-hunter-text">
                {weapon.affinity > 0 ? '+' : ''}
                {weapon.affinity}%
              </span>
            </div>

            {weapon.defenseBonus !== undefined &&
              weapon.defenseBonus !== 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-hunter-muted">{' '}{t("Defense Bonus")}{' '}</span>

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
            <p className="mb-2 text-sm text-hunter-muted">{' '}{t("Slots")}{' '}</p>

            {weapon.slots.length === 0 ? (
              <span className="text-sm text-hunter-muted">{' '}{t("No slots")}{' '}</span>
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
                          ? t("Change {0}", [equippedDecoration.decoration.name])
                          : t("Add decoration · Slot size {0}", [slot.size])
                      }
                    >
                      {equippedDecoration
                        ? t(equippedDecoration.decoration.name)
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
