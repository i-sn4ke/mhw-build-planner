import { useMemo, useState } from 'react'
import type { Weapon } from '../types/armor'
import { matchesWeaponElement } from '../engine/weaponFilters'

interface WeaponSelectorProps {
  weapons: Weapon[]
  onSelect: (weapon: Weapon) => void
  onClose: () => void
}

const weaponTypeNames: Record<Weapon['type'], string> = {
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

function WeaponSelector({
  weapons,
  onSelect,
  onClose,
}: WeaponSelectorProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [elementFilter, setElementFilter] = useState('all')

  const weaponTypes = useMemo(
    () =>
      Array.from(
        new Set(weapons.map((weapon) => weapon.type)),
      ).sort((a, b) =>
        weaponTypeNames[a].localeCompare(weaponTypeNames[b]),
      ),
    [weapons],
  )

  const rarities = useMemo(
    () =>
      Array.from(
        new Set(weapons.map((weapon) => weapon.rarity)),
      ).sort((a, b) => a - b),
    [weapons],
  )

  const filteredWeapons = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    return weapons
      .filter((weapon) => {
        const matchesSearch =
          normalizedSearch === '' ||
          weapon.name
            .toLowerCase()
            .includes(normalizedSearch)

        const matchesType =
          typeFilter === 'all' ||
          weapon.type === typeFilter

        const matchesRarity =
          rarityFilter === 'all' ||
          weapon.rarity === Number(rarityFilter)

        const matchesElement = matchesWeaponElement(weapon, elementFilter)

        return (
          matchesSearch &&
          matchesType &&
          matchesRarity && matchesElement
        )
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name),
      )
  }, [
    weapons,
    search,
    typeFilter,
    rarityFilter,
    elementFilter,
  ])

  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== 'all' ||
    rarityFilter !== 'all' || elementFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setRarityFilter('all')
    setElementFilter('all')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-[#30343a] bg-[#191b1f]">
        <div className="flex items-center justify-between border-b border-[#30343a] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#e7e4da]">
              Select Weapon
            </h2>

            <p className="mt-1 text-sm text-[#666a70]">
              {filteredWeapons.length} weapon
              {filteredWeapons.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-[#666a70] transition hover:bg-[#25282d] hover:text-[#e7e4da]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 border-b border-[#30343a] p-4">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search weapons..."
            className="w-full rounded-md border border-[#30343a] bg-[#111214] px-3 py-2 text-sm text-[#e7e4da] outline-none placeholder:text-[#666a70] focus:border-[#c99a45]"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              aria-label="Weapon type"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              className="w-full rounded-md border border-[#30343a] bg-[#111214] px-3 py-2 text-sm text-[#e7e4da] outline-none focus:border-[#c99a45]"
            >
              <option value="all">
                All weapon types
              </option>

              {weaponTypes.map((type) => (
                <option key={type} value={type}>
                  {weaponTypeNames[type]}
                </option>
              ))}
            </select>

            <select
              aria-label="Weapon rarity"
              value={rarityFilter}
              onChange={(event) =>
                setRarityFilter(event.target.value)
              }
              className="w-full rounded-md border border-[#30343a] bg-[#111214] px-3 py-2 text-sm text-[#e7e4da] outline-none focus:border-[#c99a45]"
            >
              <option value="all">
                All rarities
              </option>

              {rarities.map((rarity) => (
                <option
                  key={rarity}
                  value={rarity}
                >
                  Rarity {rarity}
                </option>
              ))}
            </select>
          </div>

          <label className="block text-sm text-[#9b9b95]">
            Element / Status
            <select
              aria-label="Element / Status"
              value={elementFilter}
              onChange={(event) => setElementFilter(event.target.value)}
              className="mt-1 w-full rounded-md border border-[#30343a] bg-[#111214] px-3 py-2 text-sm text-[#e7e4da] outline-none focus:border-[#c99a45]"
            >
              <option value="all">Any element / status</option>
              <optgroup label="Elements">
                <option value="fire">Fire</option>
                <option value="water">Water</option>
                <option value="thunder">Thunder</option>
                <option value="ice">Ice</option>
                <option value="dragon">Dragon</option>
              </optgroup>
              <optgroup label="Status">
                <option value="poison">Poison</option>
                <option value="paralysis">Paralysis</option>
                <option value="sleep">Sleep</option>
                <option value="blast">Blast</option>
              </optgroup>
            </select>
            {elementFilter !== 'all' && (
              <span className="mt-1 block text-xs text-[#777b82]">
                Hidden elements and statuses are excluded.
              </span>
            )}
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-left text-sm text-[#c99a45] transition hover:text-[#e7e4da]"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          {filteredWeapons.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[#666a70]">
                No weapons found.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm text-[#c99a45] transition hover:text-[#e7e4da]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWeapons.map((weapon) => (
                <button
                  key={weapon.id}
                  type="button"
                  onClick={() => onSelect(weapon)}
                  className="w-full rounded-md border border-[#30343a] bg-[#111214] p-4 text-left transition hover:border-[#c99a45] hover:bg-[#1d2024]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="break-words font-medium text-[#e7e4da]">
                        {weapon.name}
                      </div>

                      <div className="mt-1 text-sm text-[#9b9b95]">
                        {weaponTypeNames[weapon.type]} · Rarity{' '}
                        {weapon.rarity}
                      </div>
                    </div>

                    <div className="shrink-0 text-right text-sm">
                      <div className="text-[#e7e4da]">
                        {weapon.attack} Attack
                      </div>

                      <div className="mt-1 text-[#9b9b95]">
                        {weapon.affinity}% Affinity
                      </div>
                    </div>
                  </div>

                  {weapon.elements.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {weapon.elements.map((element, index) => (
                        <span
                          key={`${weapon.id}-element-${index}`}
                          className="inline-flex flex-wrap items-center gap-1 rounded bg-[#191b1f] px-2 py-1 text-xs text-[#e7e4da]"
                        >
                          <span>{element.type}</span>
                          <span className="font-semibold text-[#c99a45]">{element.damage}</span>
                          {element.hidden && <span className="text-[#777b82]">Hidden</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[#777b82]">Element / Status: None</p>
                  )}

                  {weapon.slots.length > 0 && (
                    <div className="mt-3 flex gap-1">
                      {weapon.slots.map(
                        (slot, index) => (
                          <span
                            key={`${weapon.id}-slot-${index}`}
                            className="flex h-6 w-6 items-center justify-center rounded border border-[#454950] text-xs text-[#c99a45]"
                          >
                            {slot.size}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WeaponSelector
