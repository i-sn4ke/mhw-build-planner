import EquipmentSkillList from './EquipmentSkillList'
import EquipmentOption from './EquipmentOption'
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
      <div className="hunter-dialog flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-hunter-border bg-hunter-panel">
        <div className="flex items-center justify-between border-b border-hunter-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-hunter-text">
              Select Charm
            </h2>

            <p className="mt-1 text-sm text-hunter-muted">
              {filteredCharms.length} charm
              {filteredCharms.length === 1 ? '' : 's'}
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

        <div className="border-b border-hunter-border p-4">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search charms or skills..."
            className="w-full rounded-md border border-hunter-border bg-hunter-ink px-3 py-2 text-sm text-hunter-text outline-none placeholder:text-hunter-muted focus:border-hunter-gold"
          />
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          {filteredCharms.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-hunter-muted">
                No charms found.
              </p>

              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-3 text-sm text-hunter-gold transition hover:text-hunter-text"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCharms.map((charm) => (
                <EquipmentOption
                  key={charm.id}
                  name={charm.name}
                  onSelect={() => onSelect(charm)}
                  className="w-full rounded-md border border-hunter-border bg-hunter-ink p-4 text-left transition hover:border-hunter-gold hover:bg-hunter-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-hunter-text">
                        {charm.name}
                      </div>

                      <div className="mt-1 text-sm text-hunter-muted">
                        Rarity {charm.rarity}
                      </div>
                    </div>
                  </div>

                  <EquipmentSkillList skills={charm.skills} />
                </EquipmentOption>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CharmSelector
