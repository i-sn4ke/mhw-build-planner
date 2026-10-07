import { useTranslation } from '../i18n/useTranslation'
import EquipmentSkillList from './EquipmentSkillList'
import EquipmentIcon from './EquipmentIcon'
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
  const { t } = useTranslation()
  return (
    <div className="hunter-charm-row hunter-equipment-row hunter-item-row border-t border-hunter-border pt-3">
      <EquipmentIcon category="charm" rarity={charm?.rarity} onSelect={onSelectCharm} />
      {charm && <button type="button" onClick={onClearCharm} aria-label={t("Remove charm")} title={t("Remove charm")} className="hunter-slot-remove text-xs text-hunter-muted hover:text-red-400">✕</button>}
      {!charm ? (
        <p className="hunter-slot-content hunter-slot-empty text-sm text-hunter-muted">{t("No charm selected.")}</p>
      ) : (
        <div className="hunter-slot-content space-y-2">
          <div className="hunter-item-summary flex items-center gap-3">
            <div className="min-w-0">
            <p className="break-words font-medium text-hunter-text">
              {t(charm.name)}
            </p>

            <p className="mt-1 text-xs text-hunter-muted">{' '}{t("Rarity")}{' '}{charm.rarity}
            </p>
            </div>
          </div>

          {charm.skills.length > 0 && (
            <div>
              <p className="mb-2 text-sm text-hunter-muted">{' '}{t("Skills")}{' '}</p>

              <EquipmentSkillList skills={charm.skills} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CharmStatsPanel
