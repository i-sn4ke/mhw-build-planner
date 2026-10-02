import type { Weapon } from '../types/armor'

export function matchesWeaponElement(weapon: Weapon, element: string) {
  return element === 'all' || weapon.elements.some(
    (entry) => !entry.hidden && entry.type.toLowerCase() === element,
  )
}
