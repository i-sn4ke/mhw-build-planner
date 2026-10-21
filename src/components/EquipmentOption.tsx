import { useTranslation } from '../i18n/useTranslation'
import type { ReactNode } from 'react'

// Selection and skill details are separate buttons, so opening a tooltip never equips the item.
export default function EquipmentOption({ name, onSelect, className, children, selected = false }: {
  name: string
  onSelect: () => void
  className: string
  children: ReactNode
  selected?: boolean
}) {
  const { t } = useTranslation()
  return <div data-equipped={selected || undefined} className={`hunter-equipment-option relative ${className}`}>
    <button type="button" aria-current={selected ? 'true' : undefined} aria-label={t("Select {0}", [name])} onClick={onSelect} className="hunter-option-select absolute inset-0 rounded" />
    {selected && <span className="hunter-equipped-badge">{t("Equipped")}</span>}
    {children}
  </div>
}
