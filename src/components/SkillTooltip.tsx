import { useTranslation } from '../i18n/useTranslation'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SkillDefinition } from '../types/skillDefinition'
import { supportedOffensiveSkills } from '../engine/skillEffects'

interface SkillTooltipProps {
  definition: SkillDefinition
  level: number
  className?: string
}

function SkillTooltip({ definition, level, className = '' }: SkillTooltipProps) {
  const { t } = useTranslation()
  const id = useId()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const [position, setPosition] = useState<{ left: number; width: number; maxHeight?: number; top?: number; bottom?: number }>({ left: 16, width: 320 })
  const show = () => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const above = window.innerHeight - rect.bottom < 260 && rect.top > window.innerHeight - rect.bottom
    const viewportWidth = document.documentElement.clientWidth
    const width = Math.min(320, viewportWidth - 32)
    setPosition({
      width,
      left: Math.max(16, Math.min(rect.left, viewportWidth - width - 16)),
      maxHeight: Math.max(0, (above ? rect.top : window.innerHeight - rect.bottom) - 24),
      ...(above ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
    })
    setOpen(true)
  }
  const effect = definition.levels.find((entry) => entry.level === level)?.description
  const capSkill = definition.id === 'inheritance' || definition.unlocksSkillId !== undefined

  useEffect(() => {
    if (!open) return
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target) && !tooltipRef.current?.contains(event.target)) setOpen(false)
    }
    const scroll = (event: Event) => {
      if (event.target instanceof Node && tooltipRef.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', dismiss)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('scroll', scroll, true)
    window.addEventListener('resize', dismissOnResize)
    function dismissOnResize() { setOpen(false) }
    return () => {
      document.removeEventListener('keydown', dismiss)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('scroll', scroll, true)
      window.removeEventListener('resize', dismissOnResize)
    }
  }, [open])

  return (
    <span ref={containerRef} className="relative inline-block min-w-0" onMouseEnter={show} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        data-skill-tooltip="true"
        aria-label={t("Skill details: {0}", [definition.name])}
        aria-describedby={open ? id : undefined}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onClick={show}
        onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}
        className={`rounded text-left underline decoration-dotted underline-offset-4 outline-none hover:text-hunter-gold focus-visible:ring-1 focus-visible:ring-hunter-gold ${className}`}
      >
        <span>{t(definition.name)}</span>
      </button>
      {open && createPortal(
        <span ref={tooltipRef} id={id} role="tooltip" style={position} className="hunter-skill-tooltip fixed z-[70] block w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto rounded-md border border-hunter-trim bg-hunter-ink p-3 text-left text-xs font-normal leading-relaxed text-hunter-text shadow-xl">
          <span className="block font-semibold text-hunter-gold">{t(definition.name)}</span>
          <span className="mt-1 block">{t(definition.description || 'No description available.')}</span>
          <span className="mt-2 block">{t("Lv")} {level}: {t(effect ?? 'No level effect description available.')}</span>
          <span className="mt-2 block text-hunter-muted">
            {supportedOffensiveSkills.has(definition.id)
              ? t("Included in attack / affinity simulation when its conditions are met.")
              : capSkill ? t("Skill cap unlocks are included in the build calculation.")
                : t("This skill is not included in the current attack / affinity simulation.")}
          </span>
        </span>, document.body,
      )}
    </span>
  )
}

export default SkillTooltip
