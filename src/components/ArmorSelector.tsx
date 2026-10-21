import SearchHighlight from './SearchHighlight'
import { getSearchText } from '../i18n/catalog'
import { useTranslation } from '../i18n/useTranslation'
import EquipmentSkillList from './EquipmentSkillList'
import EquipmentOption from './EquipmentOption'
import { useMemo } from 'react'
import type { ArmorPiece, ArmorSlot } from '../types/armor'
import type { SkillDefinition } from '../types/skillDefinition'
import { matchesEquipmentSearch } from '../engine/equipmentFilters'

export interface ArmorSelectorFilters {
  search: string
  rankFilter: string
}

interface ArmorSelectorProps {
  filters: ArmorSelectorFilters
  onFiltersChange: (filters: ArmorSelectorFilters) => void
  selectedId?: string

  armors: ArmorPiece[]
  slot: ArmorSlot
  skills: SkillDefinition[]
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
  filters,
  onFiltersChange,
  selectedId,
  armors,
  slot,
  skills,
  onSelect,
  onClose,
}: ArmorSelectorProps) {
  const { t } = useTranslation()
  const search = filters.search
  const setSearch = (search: string) => onFiltersChange({ ...filters, search })
  const rankFilter = filters.rankFilter
  const setRankFilter = (rankFilter: string) => onFiltersChange({ ...filters, rankFilter })

  const skillNameById = useMemo(
    () => new Map(skills.map((skill) => [skill.id, getSearchText(skill.name)])),
    [skills],
  )

  const filteredArmors = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    return armors
      .filter((armor) => {
        const matchesSearch = matchesEquipmentSearch({ ...armor, name: getSearchText(armor.name) }, normalizedSearch, skillNameById)

        const matchesRank =
          rankFilter === 'all' ||
          armor.rank === rankFilter

        return matchesSearch && matchesRank
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name),
      )
  }, [armors, search, rankFilter, skillNameById])


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="hunter-dialog flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-hunter-border bg-hunter-panel">
        <div className="flex items-center justify-between border-b border-hunter-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-hunter-text">{' '}{t("Select")}{' '}{t(slotNames[slot])}
            </h2>

            <p className="mt-1 text-sm text-hunter-muted">
              {t(filteredArmors.length === 1 ? '{0} piece' : '{0} pieces', [filteredArmors.length])}
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
            placeholder={t("Search {0} or skills...", [slotNames[slot].toLowerCase()])}
            className="w-full rounded-md border border-hunter-border bg-hunter-ink px-3 py-2 text-sm text-hunter-text outline-none placeholder:text-hunter-muted focus:border-hunter-gold"
          />

          <select
            value={rankFilter}
            onChange={(event) =>
              setRankFilter(event.target.value)
            }
            className="w-full rounded-md border border-hunter-border bg-hunter-ink px-3 py-2 text-sm text-hunter-text outline-none focus:border-hunter-gold"
          >
            <option value="all">{t("All ranks")}</option>
            <option value="low">{t("Low Rank")}</option>
            <option value="high">{t("High Rank")}</option>
            <option value="master">{t("Master Rank")}</option>
          </select>
        </div>

        {(search.trim() || rankFilter !== 'all') && <button type="button" onClick={() => onFiltersChange({ search: '', rankFilter: 'all' })} className="px-4 py-2 text-left text-sm text-hunter-gold">{t("Clear filters")}</button>}

        <div className="min-h-0 overflow-y-auto p-4">
          {filteredArmors.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-hunter-muted">{' '}{t("No armor pieces found.")}{' '}</p>

              <button
                type="button"
                onClick={() => {
                  onFiltersChange({ search: '', rankFilter: 'all' })
                }}
                className="mt-3 text-sm text-hunter-gold transition hover:text-hunter-text"
              >{' '}{t("Clear filters")}{' '}</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredArmors.map((armor) => (
                <EquipmentOption
                  key={armor.id}
                  name={armor.name}
                  selected={armor.id === selectedId}
                  onSelect={() => onSelect(armor)}
                  className="w-full rounded-md border border-hunter-border bg-hunter-ink p-4 text-left transition hover:border-hunter-gold hover:bg-hunter-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-hunter-text">
                        <SearchHighlight name={armor.name} query={search} />
                      </div>

                      <div className="mt-1 text-sm text-hunter-muted">{' '}{t("Rarity")}{' '}{armor.rarity} ·{' '}
                        {t("{0} rank", [armor.rank])} ·{' '}
                        {armor.defense.base} {t("Defense")}</div>
                    </div>

                    {armor.slots.length > 0 && (
                      <div className="flex shrink-0 gap-1">
                        {armor.slots.map(
                          (slotSize, index) => (
                            <span
                              key={`${armor.id}-slot-${index}`}
                              className="flex h-6 w-6 items-center justify-center rounded border border-hunter-trim text-xs text-hunter-gold"
                            >
                              {slotSize.size}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  <EquipmentSkillList skills={armor.skills} search={search} />
                </EquipmentOption>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArmorSelector
