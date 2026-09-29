import { useMemo, useState } from 'react'
import type { Weapon } from '../types/armor'

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

        return (
          matchesSearch &&
          matchesType &&
          matchesRarity
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
  ])

  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== 'all' ||
    rarityFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setRarityFilter('all')
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
                    <div>
                      <div className="font-medium text-[#e7e4da]">
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