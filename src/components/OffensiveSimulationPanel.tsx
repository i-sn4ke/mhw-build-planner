import { useState } from 'react'
import type { Weapon } from '../types/armor'
import type { CalculatedSkills } from '../types/calculatedSkill'
import type { SkillSimulationConditions } from '../types/skillSimulation'
import { defaultSimulationConditions, simulateOffensiveSkills, supportedOffensiveSkills } from '../engine/skillEffects'
import { skills as definitions } from '../data/skills'
import SkillTooltip from './SkillTooltip'
import { HunterStatIcon } from './EquipmentIcon'

const skillById = new Map(definitions.map((definition) => [definition.id, definition]))
const controlClass = 'mt-1 block w-full rounded-md border border-hunter-border bg-hunter-ink px-2 py-2 text-sm text-hunter-text focus:border-hunter-gold'
const percentage = (value: number) => `${value > 0 ? '+' : ''}${value}%`

function OffensiveSimulationPanel({ weapon, skills }: { weapon: Weapon | null; skills: CalculatedSkills }) {
  const [conditions, setConditions] = useState(defaultSimulationConditions)
  const offense = simulateOffensiveSkills(weapon, skills, conditions)
  const unsupported = Object.entries(skills).filter(([id, skill]) =>
    skill.level > 0 && !supportedOffensiveSkills.has(id) && id !== 'inheritance' && !skillById.get(id)?.unlocksSkillId,
  )
  const update = <K extends keyof SkillSimulationConditions>(key: K, value: SkillSimulationConditions[K]) => setConditions((current) => ({ ...current, [key]: value }))

  return (
    <section className="hunter-panel hunter-simulation min-w-0 rounded-lg border border-hunter-gold/60 bg-hunter-panel p-4 sm:p-5" aria-label="Attack / Affinity Simulation">
      <h3 className="hunter-panel-heading text-xs font-semibold uppercase tracking-wider text-hunter-muted">Attack / Affinity Simulation</h3>
      <p className="mt-2 text-xs text-hunter-muted">Local scenario only; conditions are not saved in shared links. Defense, resistances and elements remain base values.</p>
      <dl className="mt-4 grid grid-cols-2 gap-3" aria-live="polite">
        <div className="rounded-md bg-hunter-inset p-3">
          <dt className="flex items-center gap-2 text-sm text-hunter-muted"><HunterStatIcon name="attack" />Simulated Attack</dt>
          <dd className="mt-1 text-3xl font-semibold text-hunter-gold">{weapon ? offense.attack : '—'}</dd>
        </div>
        <div className="rounded-md bg-hunter-inset p-3">
          <dt className="flex items-center gap-2 text-sm text-hunter-muted"><HunterStatIcon name="affinity" />Simulated Affinity</dt>
          <dd className="mt-1 text-3xl font-semibold text-hunter-gold">{weapon ? percentage(offense.affinity) : '—'}</dd>
        </div>
      </dl>
      {offense.uncappedAffinity > 100 && <p className="mt-1 text-xs text-hunter-muted">Affinity before cap: {percentage(offense.uncappedAffinity)}. Effective affinity is capped at 100%.</p>}

      <fieldset disabled={!weapon} className="hunter-conditions mt-4 grid gap-3 sm:grid-cols-2 disabled:opacity-50">
        <legend className="mb-2 text-sm font-semibold">Manual Conditions</legend>
        <div className="hunter-condition-grid">
        <label className="hunter-target block text-sm text-hunter-muted">
          Target (Weakness Exploit)
          <select aria-label="Target (Weakness Exploit)" value={conditions.target} onChange={(event) => update('target', event.target.value as SkillSimulationConditions['target'])} className={controlClass}>
            <option value="normal">Normal hit</option>
            <option value="weak">Weak spot</option>
            <option value="wounded-weak">Wounded weak spot</option>
          </select>
        </label>
        <label className="hunter-health block text-sm text-hunter-muted">
          Health (Peak Performance / Resentment)
          <select aria-label="Health (Peak Performance / Resentment)" value={conditions.health} onChange={(event) => update('health', event.target.value as SkillSimulationConditions['health'])} className={controlClass}>
            <option value="normal">Normal</option>
            <option value="full">Full health</option>
            <option value="recoverable">Recoverable damage (red health)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.monsterEnraged} onChange={(event) => update('monsterEnraged', event.target.checked)} className="accent-hunter-gold" />
          Monster enraged (Agitator)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.maximumMightActive} onChange={(event) => update('maximumMightActive', event.target.checked)} className="accent-hunter-gold" />
          Maximum Might requirement met
        </label>
        <p className="text-xs text-hunter-muted sm:col-span-2">Includes any required stamina duration; no timer is simulated.</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.latentPowerActive} onChange={(event) => update('latentPowerActive', event.target.checked)} className="accent-hunter-gold" />
          Latent Power active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.drawAttack} onChange={(event) => update('drawAttack', event.target.checked)} className="accent-hunter-gold" />
          Draw attack (Critical Draw)
        </label>
        <button type="button" onClick={() => setConditions(defaultSimulationConditions())} className="rounded-md border border-hunter-border px-3 py-2 text-xs text-hunter-muted hover:border-hunter-gold">Reset Conditions</button>
        </div>
      </fieldset>

      {!!offense.contributions.length && (
        <div className="hunter-contributions mt-4 grid gap-2 sm:grid-cols-2">
          <h4 className="text-xs font-semibold text-hunter-muted sm:col-span-2">Skill Contributions</h4>
          {offense.contributions.map((entry) => {
            const definition = skillById.get(entry.skillId)
            return (
              <div key={entry.skillId} className="rounded bg-hunter-inset p-2 text-xs">
                {definition ? <SkillTooltip definition={definition} level={entry.level} /> : entry.skillId}
                <span className={`ml-2 ${entry.active ? 'text-hunter-gold' : 'text-hunter-muted'}`}>{entry.active ? 'Active' : 'Inactive'}</span>
                <p className="mt-1 text-hunter-muted">
                  {!entry.active ? 'Condition not met.' : [entry.rawAttack ? `+${entry.rawAttack} true raw attack` : '', entry.affinity ? `${percentage(entry.affinity)} affinity` : ''].filter(Boolean).join(' · ')}
                </p>
              </div>
            )
          })}
        </div>
      )}
      {!!unsupported.length && (
        <details className="mt-4 text-xs text-hunter-muted">
          <summary className="cursor-pointer">Other equipped skills are not simulated here ({unsupported.length})</summary>
          <ul className="mt-2 space-y-1">
            {unsupported.map(([id]) => <li key={id}>{skillById.get(id)?.name ?? id}</li>)}
          </ul>
        </details>
      )}
    </section>
  )
}

export default OffensiveSimulationPanel
