import { skills as definitions } from '../data/skills'
import SkillTooltip from './SkillTooltip'

const definitionById = new Map(definitions.map((skill) => [skill.id, skill]))

export default function EquipmentSkillList({ skills }: {
  skills: { skillId: string; level: number }[]
}) {
  if (!skills.length) return null
  return <div className="hunter-equipment-skills mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-hunter-gold">
    {skills.map((skill) => {
      const definition = definitionById.get(skill.skillId)
      return <span key={skill.skillId}>
        {definition ? <SkillTooltip definition={definition} level={skill.level} /> : skill.skillId} +{skill.level}
      </span>
    })}
  </div>
}
