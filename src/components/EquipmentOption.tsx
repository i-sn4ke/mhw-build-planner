import type { ReactNode } from 'react'

// Selection and skill details are separate buttons, so opening a tooltip never equips the item.
export default function EquipmentOption({ name, onSelect, className, children }: {
  name: string
  onSelect: () => void
  className: string
  children: ReactNode
}) {
  return <div className={`hunter-equipment-option relative ${className}`}>
    <button type="button" aria-label={`Select ${name}`} onClick={onSelect} className="hunter-option-select absolute inset-0 rounded" />
    {children}
  </div>
}
