import { useEffect, useId, useRef, useState } from 'react'
import type { SkillDefinition } from '../types/skillDefinition'
import { supportedOffensiveSkills } from '../engine/skillEffects'

interface SkillTooltipProps {
  definition: SkillDefinition
  level: number
  className?: string
}

function SkillTooltip({ definition, level, className = '' }: SkillTooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const effect = definition.levels.find((entry) => entry.level === level)?.description
  const capSkill = definition.id === 'inheritance' || definition.unlocksSkillId !== undefined

  useEffect(() => {
    if (!open) return
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', dismiss)
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', dismiss)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open])

  return (
    <span ref={containerRef} className="relative inline-block min-w-0" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={`Skill details: ${definition.name}`}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}
        className={`rounded text-left underline decoration-dotted underline-offset-4 outline-none hover:text-[#c99a45] focus-visible:ring-1 focus-visible:ring-[#c99a45] ${className}`}
      >
        <span>{definition.name}</span>
      </button>
      {open && (
        <span id={id} role="tooltip" className="absolute left-0 top-full z-[60] block w-64 max-w-[calc(100vw-4rem)] rounded-md border border-[#454950] bg-[#111214] p-3 text-left text-xs font-normal leading-relaxed text-[#e7e4da] shadow-xl">
          <span className="block font-semibold text-[#c99a45]">{definition.name}</span>
          <span className="mt-1 block">{definition.description || 'No description available.'}</span>
          <span className="mt-2 block">Lv {level}: {effect ?? 'No level effect description available.'}</span>
          <span className="mt-2 block text-[#9b9b95]">
            {supportedOffensiveSkills.has(definition.id)
              ? 'Included in attack / affinity simulation when its conditions are met.'
              : capSkill ? 'Skill cap unlocks are included in the build calculation.'
                : 'This skill is not included in the current attack / affinity simulation.'}
          </span>
        </span>
      )}
    </span>
  )
}

export default SkillTooltip
