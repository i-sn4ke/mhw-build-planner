import { useMemo, useState } from 'react'
import type { Weapon } from '../types/armor'
import type { SkillDefinition } from '../types/skillDefinition'
import { matchesEquipmentSearch } from '../engine/equipmentFilters'
import { matchesWeaponElement } from '../engine/weaponFilters'

interface WeaponSelectorProps {
  weapons: Weapon[]
  skills: SkillDefinition[]
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
  skills,
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

  const skillNameById = useMemo(
    () => new Map(skills.map((skill) => [skill.id, skill.name])),
    [skills],
  )

  const filteredWeapons = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    return weapons
      .filter((weapon) => {
        const matchesSearch = matchesEquipmentSearch(weapon, normalizedSearch, skillNameById)

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
    skillNameById,
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
      <div className="hunter-dialog flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-hunter-border bg-hunter-panel">
        <div className="flex items-center justify-between border-b border-hunter-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-hunter-text">
              Select Weapon
            </h2>

            <p className="mt-1 text-sm text-hunter-muted">
              {filteredWeapons.length} weapon
              {filteredWeapons.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-hunter-muted transition hover:bg-hunter-hover hover:text-hunter-text"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 border-b border-hunter-border p-4">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search weapons or skills..."
            className="w-full rounded-md border border-hunter-border bg-hunter-ink px-3 py-2 text-sm text-hunter-text outline-none placeholder:text-hunter-muted focus:border-hunter-gold"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              aria-label="Weapon type"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              className="w-full rounded-md border border-hunter-border bg-hunter-ink px-3 py-2 text-sm text-hunter-text outline-none focus:border-hunter-gold"
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
              className="w-full rounded-md border border-hunter-border bg-hunter-ink px-3 py-2 text-sm text-hunter-text outline-none focus:border-hunter-gold"
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

          <label className="block text-sm text-hunter-muted">
            Element / Status
            <select
              aria-label="Element / Status"
              value={elementFilter}
              onChange={(event) => setElementFilter(event.target.value)}
              className="mt-1 w-full rounded-md border border-hunter-border bg-hunter-ink px-3 py-2 text-sm text-hunter-text outline-none focus:border-hunter-gold"
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
              <span className="mt-1 block text-xs text-hunter-muted">
                Hidden elements and statuses are excluded.
              </span>
            )}
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-left text-sm text-hunter-gold transition hover:text-hunter-text"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          {filteredWeapons.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-hunter-muted">
                No weapons found.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm text-hunter-gold transition hover:text-hunter-text"
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
                  className="w-full rounded-md border border-hunter-border bg-hunter-ink p-4 text-left transition hover:border-hunter-gold hover:bg-hunter-hover"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="break-words font-medium text-hunter-text">
                        {weapon.name}
                      </div>

                      <div className="mt-1 text-sm text-hunter-muted">
                        {weaponTypeNames[weapon.type]} · Rarity{' '}
                        {weapon.rarity}
                      </div>
                    </div>

                    <div className="shrink-0 text-right text-sm">
                      <div className="text-hunter-text">
                        {weapon.attack} Attack
                      </div>

                      <div className="mt-1 text-hunter-muted">
                        {weapon.affinity}% Affinity
                      </div>
                    </div>
                  </div>

                  {weapon.elements.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {weapon.elements.map((element, index) => (
                        <span
                          key={`${weapon.id}-element-${index}`}
                          className="inline-flex flex-wrap items-center gap-1 rounded bg-hunter-panel px-2 py-1 text-xs text-hunter-text"
                        >
                          <span>{element.type}</span>
                          <span className="font-semibold text-hunter-gold">{element.damage}</span>
                          {element.hidden && <span className="text-hunter-muted">Hidden</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-hunter-muted">Element / Status: None</p>
                  )}

                  {weapon.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {weapon.skills.map((skill) => (
                        <span
                          key={skill.skillId}
                          className="text-sm text-hunter-gold"
                        >
                          {skillNameById.get(skill.skillId) ?? skill.skillId} +{skill.level}
                        </span>
                      ))}
                    </div>
                  )}

                  {weapon.slots.length > 0 && (
                    <div className="mt-3 flex gap-1">
                      {weapon.slots.map(
                        (slot, index) => (
                          <span
                            key={`${weapon.id}-slot-${index}`}
                            className="flex h-6 w-6 items-center justify-center rounded border border-hunter-trim text-xs text-hunter-gold"
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
