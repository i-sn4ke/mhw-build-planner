import { useMemo, useState } from 'react'
import type { Decoration } from '../types/decoration'
import type { SkillDefinition } from '../types/skillDefinition'

interface DecorationSelectorProps {
  decorations: Decoration[]
  skills: SkillDefinition[]
  slotSize: number
  hasDecoration: boolean
  onSelect: (decoration: Decoration) => void
  onRemove: () => void
  onClose: () => void
}

function DecorationSelector({
  decorations,
  skills,
  slotSize,
  hasDecoration,
  onSelect,
  onRemove,
  onClose,
}: DecorationSelectorProps) {
  const [search, setSearch] = useState('')
  const [slotFilter, setSlotFilter] = useState<number | 'all'>('all')

  const filteredDecorations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return decorations
      .filter((decoration) => decoration.slotSize <= slotSize)
      .filter(
        (decoration) =>
          slotFilter === 'all' ||
          decoration.slotSize === slotFilter,
      )
      .filter((decoration) =>
        decoration.name.toLowerCase().includes(normalizedSearch),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [decorations, slotSize, slotFilter, search])

    const getSkillName = (skillId: string) => {
      return (
        skills.find((skill) => skill.id === skillId)?.name ??
        skillId
      )
    }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[#30343a] bg-[#191b1f] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#30343a] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              Select Decoration
            </h2>

            <p className="mt-1 text-sm text-[#666a70]">
              Choose a decoration for a size {slotSize} slot
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-[#9b9b95] transition hover:bg-[#25282d] hover:text-[#e7e4da]"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-[#30343a] p-4">
          <div className="flex gap-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search decorations..."
              className="min-w-0 flex-1 rounded-lg border border-[#30343a] bg-[#15171a] px-4 py-2 text-sm text-[#e7e4da] outline-none transition placeholder:text-[#666a70] focus:border-[#c99a45]"
            />

            <select
              value={slotFilter}
              onChange={(event) => {
                const value = event.target.value

                setSlotFilter(
                  value === 'all' ? 'all' : Number(value),
                )
              }}
              className="rounded-lg border border-[#30343a] bg-[#15171a] px-3 py-2 text-sm text-[#e7e4da] outline-none transition focus:border-[#c99a45]"
            >
              <option value="all">All slots</option>

              {[1, 2, 3, 4]
                .filter((size) => size <= slotSize)
                .map((size) => (
                  <option key={size} value={size}>
                    Slot {size}
                  </option>
                ))}
            </select>
          </div>

          <p className="mt-2 text-xs text-[#666a70]">
            {filteredDecorations.length} decorations
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {hasDecoration && (
            <button
              type="button"
              onClick={onRemove}
              className="mb-3 w-full rounded-lg border border-[#30343a] bg-[#15171a] p-4 text-left text-sm text-[#9b9b95] transition hover:border-red-400 hover:text-red-400"
            >
              Remove decoration
            </button>
          )}

          {filteredDecorations.length === 0 ? (
            <p className="p-4 text-center text-[#666a70]">
              No decorations match the current filters.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredDecorations.map((decoration) => (
                <button
                  key={decoration.id}
                  type="button"
                  onClick={() => onSelect(decoration)}
                  className="w-full rounded-lg border border-[#30343a] bg-[#15171a] p-4 text-left transition hover:border-[#c99a45] hover:bg-[#1d2024]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#e7e4da]">
                        {decoration.name}
                      </p>

                      <p className="mt-1 text-xs text-[#666a70]">
                        Slot size {decoration.slotSize}
                      </p>
                    </div>

                    <span className="flex h-8 w-8 items-center justify-center rounded border border-[#454950] text-sm text-[#c99a45]">
                      {decoration.slotSize}
                    </span>
                  </div>

                  {decoration.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {decoration.skills.map((skill) => (
                        <span
                          key={skill.skillId}
                          className="text-sm text-[#c99a45]"
                        >
                          {getSkillName(skill.skillId)} +{skill.level}
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

export default DecorationSelector