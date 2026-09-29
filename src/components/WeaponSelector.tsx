import { useMemo, useState } from 'react'
import type { Weapon } from '../types/armor'

interface WeaponSelectorProps {
  weapons: Weapon[]
  onSelect: (weapon: Weapon) => void
  onClose: () => void
}

function WeaponSelector({
  weapons,
  onSelect,
  onClose,
}: WeaponSelectorProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const weaponTypes = useMemo(
    () =>
      Array.from(
        new Set(weapons.map((weapon) => weapon.type)),
      ).sort(),
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

        return matchesSearch && matchesType
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name),
      )
  }, [weapons, search, typeFilter])

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

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
            className="w-full rounded-md border border-[#30343a] bg-[#111214] px-3 py-2 text-sm text-[#e7e4da] outline-none focus:border-[#c99a45]"
          >
            <option value="all">All weapon types</option>

            {weaponTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          {filteredWeapons.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[#666a70]">
                No weapons found.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setTypeFilter('all')
                }}
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
                        {weapon.type}
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