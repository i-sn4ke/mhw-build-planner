import type { ArmorSkill } from '../types/skill'

interface SearchableEquipment {
  name: string
  skills: ArmorSkill[]
}

export function matchesEquipmentSearch(
  equipment: SearchableEquipment,
  search: string,
  skillNameById: ReadonlyMap<string, string>,
) {
  const query = search.trim().toLowerCase()

  return query === '' || equipment.name.toLowerCase().includes(query) ||
    equipment.skills.some((skill) =>
      (skillNameById.get(skill.skillId) ?? skill.skillId)
        .toLowerCase()
        .includes(query),
    )
}
