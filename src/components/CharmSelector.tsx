import { useMemo, useState } from 'react'
import type { Charm } from '../types/charm'
import type { SkillDefinition } from '../types/skillDefinition'

interface CharmSelectorProps {
  charms: Charm[]
  skills: SkillDefinition[]
  onSelect: (charm: Charm) => void
  onClose: () => void
}

function CharmSelector({
  charms,
  skills,
  onSelect,
  onClose,
}: CharmSelectorProps) {
  const [search, setSearch] = useState('')

  const skillNames = useMemo(
    () =>
      new Map(
        skills.map((skill) => [
          skill.id,
          skill.name,
        ]),
      ),
    [skills],
  )

  const getSkillName = (skillId: string) => {
    return skillNames.get(skillId) ?? skillId
  }

  const filteredCharms = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    return charms
      .filter((charm) => {
        if (normalizedSearch === '') {
          return true
        }

        const matchesName = charm.name
          .toLowerCase()
          .includes(normalizedSearch)

        const matchesSkill = charm.skills.some(
          (skill) =>
            (
              skillNames.get(skill.skillId) ??
              skill.skillId
            )
              .toLowerCase()
              .includes(normalizedSearch),
        )

        return matchesName || matchesSkill
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name),
      )
  }, [charms, search, skillNames])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-[#30343a] bg-[#191b1f]">
        <div className="flex items-center justify-between border-b border-[#30343a] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#e7e4da]">
              Select Charm
            </h2>

            <p className="mt-1 text-sm text-[#666a70]">
              {filteredCharms.length} charm
              {filteredCharms.length === 1 ? '' : 's'}
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

        <div className="border-b border-[#30343a] p-4">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search charms or skills..."
            className="w-full rounded-md border border-[#30343a] bg-[#111214] px-3 py-2 text-sm text-[#e7e4da] outline-none placeholder:text-[#666a70] focus:border-[#c99a45]"
          />
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          {filteredCharms.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[#666a70]">
                No charms found.
              </p>

              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-3 text-sm text-[#c99a45] transition hover:text-[#e7e4da]"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCharms.map((charm) => (
                <button
                  key={charm.id}
                  type="button"
                  onClick={() => onSelect(charm)}
                  className="w-full rounded-md border border-[#30343a] bg-[#111214] p-4 text-left transition hover:border-[#c99a45] hover:bg-[#1d2024]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-[#e7e4da]">
                        {charm.name}
                      </div>

                      <div className="mt-1 text-sm text-[#9b9b95]">
                        Rarity {charm.rarity}
                      </div>
                    </div>
                  </div>

                  {charm.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {charm.skills.map((skill) => (
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

export default CharmSelector