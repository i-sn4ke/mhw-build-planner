import { useTranslation } from '../i18n/useTranslation'
import type { Weapon } from '../types/armor'
import type { CalculatedSkills } from '../types/calculatedSkill'
import SimulationConditions, { type SimulationConditionsProps } from './SimulationConditions'
import { simulateOffensiveSkills, supportedOffensiveSkills } from '../engine/skillEffects'
import { skills as definitions } from '../data/skills'
import SkillTooltip from './SkillTooltip'
import { HunterStatIcon } from './EquipmentIcon'

const skillById = new Map(definitions.map((definition) => [definition.id, definition]))
const percentage = (value: number) => `${value > 0 ? '+' : ''}${value}%`

function OffensiveSimulationPanel({ weapon, skills, conditions, setConditions }: { weapon: Weapon | null; skills: CalculatedSkills } & SimulationConditionsProps) {
  const { t } = useTranslation()
  const offense = simulateOffensiveSkills(weapon, skills, conditions)
  const unsupported = Object.entries(skills).filter(([id, skill]) =>
    skill.level > 0 && !supportedOffensiveSkills.has(id) && id !== 'inheritance' && !skillById.get(id)?.unlocksSkillId,
  )

  return (
    <section className="hunter-panel hunter-simulation min-w-0 rounded-lg border border-hunter-gold/60 bg-hunter-panel p-4 sm:p-5" aria-label={t("Attack / Affinity Simulation")}>
      <h3 className="hunter-panel-heading text-xs font-semibold uppercase tracking-wider text-hunter-muted">{t("Attack / Affinity Simulation")}</h3>
      <p className="mt-2 text-xs text-hunter-muted">{t("Local scenario only; conditions are not saved in shared links. Defense, resistances and elements remain base values.")}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3" aria-live="polite">
        <div className="rounded-md bg-hunter-inset p-3">
          <dt className="flex items-center gap-2 text-sm text-hunter-muted"><HunterStatIcon name="attack" />{t("Simulated Attack")}</dt>
          <dd className="mt-1 text-3xl font-semibold text-hunter-gold">{weapon ? offense.attack : '—'}</dd>
        </div>
        <div className="rounded-md bg-hunter-inset p-3">
          <dt className="flex items-center gap-2 text-sm text-hunter-muted"><HunterStatIcon name="affinity" />{t("Simulated Affinity")}</dt>
          <dd className="mt-1 text-3xl font-semibold text-hunter-gold">{weapon ? percentage(offense.affinity) : '—'}</dd>
        </div>
      </dl>
      {offense.uncappedAffinity > 100 && <p className="mt-1 text-xs text-hunter-muted">{t("Affinity before cap:")} {percentage(offense.uncappedAffinity)}{t(". Effective affinity is capped at 100%.")}</p>}

      <SimulationConditions conditions={conditions} setConditions={setConditions} disabled={!weapon} />

      {!!offense.contributions.length && (
        <div className="hunter-contributions mt-4 grid gap-2 sm:grid-cols-2">
          <h4 className="text-xs font-semibold text-hunter-muted sm:col-span-2">{t("Skill Contributions")}</h4>
          {offense.contributions.map((entry) => {
            const definition = skillById.get(entry.skillId)
            return (
              <div key={entry.skillId} className="rounded bg-hunter-inset p-2 text-xs">
                {definition ? <SkillTooltip definition={definition} level={entry.level} /> : entry.skillId}
                <span className={`ml-2 ${entry.active ? 'text-hunter-gold' : 'text-hunter-muted'}`}>{entry.active ? t("Active") : t("Inactive")}</span>
                <p className="mt-1 text-hunter-muted">
                  {!entry.active ? t("Condition not met.") : [entry.rawAttack ? t('+{0} true raw attack', [entry.rawAttack]) : '', entry.affinity ? t('{0} affinity', [percentage(entry.affinity)]) : ''].filter(Boolean).join(' · ')}
                </p>
              </div>
            )
          })}
        </div>
      )}
      {!!unsupported.length && (
        <details className="mt-4 text-xs text-hunter-muted">
          <summary className="cursor-pointer">{t("Other equipped skills are not simulated here (")}{unsupported.length})</summary>
          <ul className="mt-2 space-y-1">
            {unsupported.map(([id]) => <li key={id}>{t(skillById.get(id)?.name ?? id)}</li>)}
          </ul>
        </details>
      )}
    </section>
  )
}

export default OffensiveSimulationPanel
