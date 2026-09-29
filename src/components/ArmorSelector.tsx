import { useMemo, useState } from 'react'
import type { ArmorPiece, ArmorSlot } from '../types/armor'

interface ArmorSelectorProps {
  armors: ArmorPiece[]
  slot: ArmorSlot
  onSelect: (armor: ArmorPiece) => void
  onClose: () => void
}

const slotNames: Record<ArmorSlot, string> = {
  head: 'Head',
  chest: 'Chest',
  arms: 'Arms',
  waist: 'Waist',
  legs: 'Legs',
}

function ArmorSelector({
  armors,
  slot,
  onSelect,
  onClose,
}: ArmorSelectorProps) {
  const [search, setSearch] = useState('')
  const [rankFilter, setRankFilter] = useState('all')

  const filteredArmors = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    return armors
      .filter((armor) => {
        const matchesSearch =
          normalizedSearch === '' ||
          armor.name
            .toLowerCase()
            .includes(normalizedSearch)

        const matchesRank =
          rankFilter === 'all' ||
          armor.rank === rankFilter

        return matchesSearch && matchesRank
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name),
      )
  }, [armors, search, rankFilter])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-[#30343a] bg-[#191b1f]">
        <div className="flex items-center justify-between border-b border-[#30343a] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#e7e4da]">
              Select {slotNames[slot]}
            </h2>

            <p className="mt-1 text-sm text-[#666a70]">
              {filteredArmors.length} piece
              {filteredArmors.length === 1 ? '' : 's'}
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
            placeholder={`Search ${slotNames[slot].toLowerCase()}...`}
            className="w-full rounded-md border border-[#30343a] bg-[#111214] px-3 py-2 text-sm text-[#e7e4da] outline-none placeholder:text-[#666a70] focus:border-[#c99a45]"
          />

          <select
            value={rankFilter}
            onChange={(event) =>
              setRankFilter(event.target.value)
            }
            className="w-full rounded-md border border-[#30343a] bg-[#111214] px-3 py-2 text-sm text-[#e7e4da] outline-none focus:border-[#c99a45]"
          >
            <option value="all">All ranks</option>
            <option value="low">Low Rank</option>
            <option value="high">High Rank</option>
            <option value="master">Master Rank</option>
          </select>
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          {filteredArmors.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[#666a70]">
                No armor pieces found.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setRankFilter('all')
                }}
                className="mt-3 text-sm text-[#c99a45] transition hover:text-[#e7e4da]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredArmors.map((armor) => (
                <button
                  key={armor.id}
                  type="button"
                  onClick={() => onSelect(armor)}
                  className="w-full rounded-md border border-[#30343a] bg-[#111214] p-4 text-left transition hover:border-[#c99a45] hover:bg-[#1d2024]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-[#e7e4da]">
                        {armor.name}
                      </div>

                      <div className="mt-1 text-sm text-[#9b9b95]">
                        Rarity {armor.rarity} ·{' '}
                        {armor.rank} rank ·{' '}
                        {armor.defense} Defense
                      </div>
                    </div>

                    {armor.slots.length > 0 && (
                      <div className="flex shrink-0 gap-1">
                        {armor.slots.map(
                          (slotSize, index) => (
                            <span
                              key={`${armor.id}-slot-${index}`}
                              className="flex h-6 w-6 items-center justify-center rounded border border-[#454950] text-xs text-[#c99a45]"
                            >
                              {slotSize.size}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {armor.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {armor.skills.map((skill) => (
                        <span
                          key={skill.skillId}
                          className="text-sm text-[#c99a45]"
                        >
                          {skill.skillId} +{skill.level}
                        </span>
                      ))}
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

export default ArmorSelector