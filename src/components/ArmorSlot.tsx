import type {
  ArmorPiece,
  ArmorSlot as ArmorSlotType,
} from '../types/armor'

import { skills } from '../data/skills'
import EquipmentIcon from './EquipmentIcon'
import type { EquippedDecoration } from '../types/equipment'

interface ArmorSlotProps {
  slot: ArmorSlotType
  armor?: ArmorPiece
  decorations: EquippedDecoration[]
  onSelect: () => void
  onClear: () => void
  onDecorationSlotSelect: (slotIndex: number) => void
}

const skillNameById = new Map(skills.map((skill) => [skill.id, skill.name]))

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
    <div className="hunter-equipment-row border-t border-hunter-border py-3">
      <div className="flex items-start gap-2">
        <h3 className="w-12 shrink-0 pt-2 text-xs font-semibold uppercase text-hunter-muted">{slotNames[slot]}</h3>
        <EquipmentIcon category={slot} rarity={armor?.rarity} />
        <div className="hunter-armor-content min-w-0 flex-1">
        <button type="button" onClick={onSelect} aria-label={`Select ${slotNames[slot]} armor`} className="w-full min-w-0 rounded-md text-left hover:bg-hunter-hover">
          <p className="break-words text-sm font-medium">{armor?.name ?? 'Select armor...'}</p>
          {armor && <>
            <p className="mt-1 text-xs text-hunter-muted">Rarity {armor.rarity} · {armor.rank} rank</p>
            <p className="mt-1 text-xs text-hunter-gold">{armor.skills.map((skill) => `${skillNameById.get(skill.skillId) ?? skill.skillId} +${skill.level}`).join(' · ')}</p>
          </>}
        </button>
      {armor && armor.slots.length > 0 && <div className="hunter-armor-slots mt-2 flex flex-wrap gap-1">
        {armor.slots.map((slot, index) => {
          const equipped = getDecoration(index)
          return <button key={`${armor.id}-${index}`} type="button" onClick={() => onDecorationSlotSelect(index)} className="min-h-8 min-w-8 max-w-full break-words rounded border border-hunter-trim px-2 text-left text-xs text-hunter-gold hover:border-hunter-gold" title={equipped ? `Change ${equipped.decoration.name}` : `Add decoration · Slot size ${slot.size}`}>
            {equipped ? equipped.decoration.name : slot.size}
          </button>
        })}
      </div>}
        </div>
        {armor && <button type="button" onClick={onClear} title={`Remove ${slotNames[slot]}`} aria-label={`Remove ${slotNames[slot]}`} className="shrink-0 rounded-md px-2 py-2 text-xs text-hunter-muted hover:text-red-400">✕</button>}
      </div>
    </div>
  )
}

export default ArmorSlot
