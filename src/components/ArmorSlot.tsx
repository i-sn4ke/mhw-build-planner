import { useTranslation } from '../i18n/useTranslation'
import type {
  ArmorPiece,
  ArmorSlot as ArmorSlotType,
} from '../types/armor'

import EquipmentSkillList from './EquipmentSkillList'
import EquipmentIcon from './EquipmentIcon'
import type { EquippedDecoration } from '../types/equipment'

interface ArmorSlotProps {
  slot: ArmorSlotType
  armor?: ArmorPiece
  decorations: EquippedDecoration[]
  isFixedForGeneration: boolean
  onSelect: () => void
  onClear: () => void
  onToggleFixedForGeneration: () => void
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
  isFixedForGeneration,
  onSelect,
  onClear,
  onToggleFixedForGeneration,
  onDecorationSlotSelect,
}: ArmorSlotProps) {
  const { t } = useTranslation()
  const getDecoration = (slotIndex: number) =>
    decorations.find(
      (equipped) =>
        equipped.location.type === 'armor' &&
        equipped.location.slot === slot &&
        equipped.location.slotIndex === slotIndex,
    )

  return (
    <div className="hunter-equipment-row hunter-armor-row border-t border-hunter-border py-3">
      <div className="flex items-start gap-2">
        <EquipmentIcon category={slot} rarity={armor?.rarity} onSelect={onSelect} />
        <div className="hunter-armor-content min-w-0 flex-1">
        <div className="hunter-item-summary">
          <p className="break-words text-sm font-medium">{armor ? t(armor.name) : t(`No ${slot} selected.`)}</p>
          {armor && <>
            <p className="mt-1 text-xs text-hunter-muted">{' '}{t("Rarity")} {armor.rarity} · {t("{0} rank", [armor.rank])}</p>
          </>}
        </div>
        {armor && <EquipmentSkillList skills={armor.skills} />}
      {armor && <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-hunter-muted">
        <input type="checkbox" checked={isFixedForGeneration} onChange={onToggleFixedForGeneration} className="accent-hunter-gold" aria-label={t("Keep {0} armor fixed in generated builds", [slotNames[slot]])} />{' '}{t("Keep for generated builds")}{' '}</label>}
      {armor && armor.slots.length > 0 && <div className="hunter-armor-slots mt-2 flex flex-wrap gap-1">
        {armor.slots.map((slot, index) => {
          const equipped = getDecoration(index)
          return <button key={`${armor.id}-${index}`} type="button" onClick={() => onDecorationSlotSelect(index)} className="min-h-8 min-w-8 max-w-full break-words rounded border border-hunter-trim px-2 text-left text-xs text-hunter-gold hover:border-hunter-gold" title={equipped ? t("Change {0}", [equipped.decoration.name]) : t("Add decoration · Slot size {0}", [slot.size])}>
            {equipped ? t(equipped.decoration.name) : slot.size}
          </button>
        })}
      </div>}
        </div>
        {armor && <button type="button" onClick={onClear} title={t("Remove {0}", [slotNames[slot]])} aria-label={t("Remove {0}", [slotNames[slot]])} className="hunter-slot-remove text-xs text-hunter-muted hover:text-red-400">✕</button>}
      </div>
    </div>
  )
}

export default ArmorSlot
