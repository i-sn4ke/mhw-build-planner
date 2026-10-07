import { useTranslation } from '../i18n/useTranslation'
import type { CalculatedBuildStats } from '../engine/buildCalculator'
import type { ArmorPiece, Weapon } from '../types/armor'
import type { EquippedDecoration } from '../types/equipment'
import WeaponDetails from './WeaponDetails'
import { HunterStatIcon, HunterElementIcon } from './EquipmentIcon'

interface StatsPanelProps {
  stats: CalculatedBuildStats
  weapon: Weapon | null
  armorPieces: ArmorPiece[]
  decorations: EquippedDecoration[]
}

const resistanceNames = {
  fire: 'Fire', water: 'Water', thunder: 'Thunder', ice: 'Ice', dragon: 'Dragon',
}

function StatsPanel({ stats, weapon, armorPieces, decorations }: StatsPanelProps) {
  const { t } = useTranslation()
  const equipmentSlots = [
    ...(weapon?.slots.map((slot, slotIndex) => ({
      size: slot.size,
      used: decorations.some((entry) => entry.location.type === 'weapon' && entry.location.slotIndex === slotIndex),
    })) ?? []),
    ...armorPieces.flatMap((armor) => armor.slots.map((slot, slotIndex) => ({
      size: slot.size,
      used: decorations.some((entry) => entry.location.type === 'armor' && entry.location.slot === armor.slot && entry.location.slotIndex === slotIndex),
    }))),
  ]

  return (
    <section className="hunter-panel hunter-stats" aria-labelledby="stats-title">
      <h2 id="stats-title" className="text-sm font-semibold uppercase tracking-wider text-hunter-muted">{t("Base Stats")}</h2>
      <p className="mt-2 text-xs text-hunter-muted">{' '}{t("Base equipment values. Skill effects, upgrades and augments are not applied.")}{' '}</p>

      <div className="hunter-stats-columns">
      <dl className="hunter-stat-list">
        <div className="rounded-md bg-hunter-inset p-3">
          <dt className="flex flex-wrap items-center gap-1 text-sm text-hunter-muted"><HunterStatIcon name="attack" />{' '}{t("Attack")}{' '}</dt>
          <dd className="text-lg font-semibold">{weapon ? stats.attack : '—'}</dd>
        </div>
        <div className="rounded-md bg-hunter-inset p-3">
          <dt className="flex flex-wrap items-center gap-1 text-sm text-hunter-muted"><HunterStatIcon name="affinity" />{' '}{t("Affinity")}{' '}</dt>
          <dd className={`text-lg font-semibold ${stats.affinity < 0 ? 'text-hunter-negative' : stats.affinity > 0 ? 'text-hunter-positive' : ''}`}>
            {weapon ? `${stats.affinity > 0 ? '+' : ''}${stats.affinity}%` : '—'}
          </dd>
        </div>
        <div className="rounded-md bg-hunter-inset p-3">
          <dt className="flex flex-wrap items-center gap-1 text-sm text-hunter-muted"><HunterStatIcon name="defense" />{t("Defense")}</dt>
          <dd className="text-lg font-semibold">{stats.defense}</dd>
        </div>
        <div className="col-span-3 flex items-center justify-between text-xs text-hunter-muted">
          <dt>{t("Armor base")}</dt><dd>{stats.armorDefense}</dd>
        </div>
        <div className="col-span-3 flex items-center justify-between text-xs text-hunter-muted">
          <dt>{t("Weapon bonus")}</dt><dd>{stats.weaponDefenseBonus > 0 ? '+' : ''}{stats.weaponDefenseBonus}</dd>
        </div>
      </dl>

      <div className="hunter-resistances">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-hunter-muted">{t("Resistances")}</h3>
        <dl className="flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(stats.resistances).map(([element, value]) => (
            <div key={element} className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-sm text-hunter-muted"><HunterElementIcon name={element as keyof typeof resistanceNames} />{t(resistanceNames[element as keyof typeof resistanceNames])}</dt>
              <dd className={value > 0 ? 'text-sm text-hunter-positive' : value < 0 ? 'text-sm text-hunter-negative' : 'text-sm text-hunter-muted'}>
                {value > 0 ? `+${value}` : value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      </div>

      <details className="mt-4 border-t border-hunter-border pt-4">
        <summary className="mb-2 cursor-pointer text-xs font-semibold uppercase tracking-wider text-hunter-muted">{t("Weapon Details")}</summary>
        {weapon ? (
          <>
            <WeaponDetails weapon={weapon} />
            {!weapon.elements.length && <p className="mt-2 text-sm text-hunter-muted">{t("Element / Status: None")}</p>}
          </>
        ) : <p className="text-sm text-hunter-muted">{' '}{t("No weapon selected.")}{' '}</p>}
      </details>

      <div className="mt-4 border-t border-hunter-border pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-hunter-muted">{t("Decoration Slots")}</h3>
        <p className="mb-2 text-xs text-hunter-muted">{equipmentSlots.filter((slot) => slot.used).length} / {equipmentSlots.length} {t("used")}</p>
        <dl className="flex flex-wrap gap-x-5 gap-y-2">
          {[4, 3, 2, 1].map((size) => {
            const slots = equipmentSlots.filter((slot) => slot.size === size)
            if (!slots.length) return null
            return (
              <div key={size} className="flex items-center justify-between gap-2 text-sm">
                <dt className="text-hunter-muted">{t("Size")} {size}</dt>
                <dd>{slots.filter((slot) => slot.used).length} / {slots.length} {t("used")}</dd>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}

export default StatsPanel
