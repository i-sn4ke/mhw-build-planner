import { useState } from 'react'
import type { Weapon } from '../types/armor'
import type { CalculatedSkills } from '../types/calculatedSkill'
import type { SkillSimulationConditions } from '../types/skillSimulation'
import { defaultSimulationConditions, simulateOffensiveSkills, supportedOffensiveSkills } from '../engine/skillEffects'
import { skills as definitions } from '../data/skills'
import SkillTooltip from './SkillTooltip'

const skillById = new Map(definitions.map((definition) => [definition.id, definition]))
const controlClass = 'mt-1 block w-full rounded-md border border-[#30343a] bg-[#111214] px-2 py-2 text-sm text-[#e7e4da] focus:border-[#c99a45]'
const percentage = (value: number) => `${value > 0 ? '+' : ''}${value}%`

function OffensiveSimulationPanel({ weapon, skills }: { weapon: Weapon | null; skills: CalculatedSkills }) {
  const [conditions, setConditions] = useState(defaultSimulationConditions)
  const offense = simulateOffensiveSkills(weapon, skills, conditions)
  const unsupported = Object.entries(skills).filter(([id, skill]) =>
    skill.level > 0 && !supportedOffensiveSkills.has(id) && id !== 'inheritance' && !skillById.get(id)?.unlocksSkillId,
  )
  const update = <K extends keyof SkillSimulationConditions>(key: K, value: SkillSimulationConditions[K]) => setConditions((current) => ({ ...current, [key]: value }))

  return (
    <div className="mt-4 border-t border-[#30343a] pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9b9b95]">Attack / Affinity Simulation</h3>
      <p className="mt-2 text-xs text-[#777b82]">Local scenario only; conditions are not saved in shared links. Defense, resistances and elements remain base values.</p>
      <dl className="mt-3 space-y-2" aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-sm text-[#9b9b95]">Simulated Attack</dt>
          <dd className="text-lg font-semibold text-[#c99a45]">{weapon ? offense.attack : '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-sm text-[#9b9b95]">Simulated Affinity</dt>
          <dd className="text-lg font-semibold text-[#c99a45]">{weapon ? percentage(offense.affinity) : '—'}</dd>
        </div>
      </dl>
      {offense.uncappedAffinity > 100 && <p className="mt-1 text-xs text-[#9b9b95]">Affinity before cap: {percentage(offense.uncappedAffinity)}. Effective affinity is capped at 100%.</p>}

      <fieldset disabled={!weapon} className="mt-4 space-y-3 disabled:opacity-50">
        <legend className="mb-2 text-sm font-semibold">Manual Conditions</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.monsterEnraged} onChange={(event) => update('monsterEnraged', event.target.checked)} className="accent-[#c99a45]" />
          Monster enraged (Agitator)
        </label>
        <label className="block text-sm text-[#9b9b95]">
          Target (Weakness Exploit)
          <select aria-label="Target (Weakness Exploit)" value={conditions.target} onChange={(event) => update('target', event.target.value as SkillSimulationConditions['target'])} className={controlClass}>
            <option value="normal">Normal hit</option>
            <option value="weak">Weak spot</option>
            <option value="wounded-weak">Wounded weak spot</option>
          </select>
        </label>
        <label className="block text-sm text-[#9b9b95]">
          Health (Peak Performance / Resentment)
          <select aria-label="Health (Peak Performance / Resentment)" value={conditions.health} onChange={(event) => update('health', event.target.value as SkillSimulationConditions['health'])} className={controlClass}>
            <option value="normal">Normal</option>
            <option value="full">Full health</option>
            <option value="recoverable">Recoverable damage (red health)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.maximumMightActive} onChange={(event) => update('maximumMightActive', event.target.checked)} className="accent-[#c99a45]" />
          Maximum Might requirement met
        </label>
        <p className="text-xs text-[#777b82]">Includes any required stamina duration; no timer is simulated.</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.latentPowerActive} onChange={(event) => update('latentPowerActive', event.target.checked)} className="accent-[#c99a45]" />
          Latent Power active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.drawAttack} onChange={(event) => update('drawAttack', event.target.checked)} className="accent-[#c99a45]" />
          Draw attack (Critical Draw)
        </label>
        <button type="button" onClick={() => setConditions(defaultSimulationConditions())} className="rounded-md border border-[#30343a] px-3 py-2 text-xs text-[#9b9b95] hover:border-[#c99a45]">Reset Conditions</button>
      </fieldset>

      {!!offense.contributions.length && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold text-[#9b9b95]">Skill Contributions</h4>
          {offense.contributions.map((entry) => {
            const definition = skillById.get(entry.skillId)
            return (
              <div key={entry.skillId} className="rounded bg-[#15171a] p-2 text-xs">
                {definition ? <SkillTooltip definition={definition} level={entry.level} /> : entry.skillId}
                <span className={`ml-2 ${entry.active ? 'text-[#c99a45]' : 'text-[#777b82]'}`}>{entry.active ? 'Active' : 'Inactive'}</span>
                <p className="mt-1 text-[#9b9b95]">
                  {!entry.active ? 'Condition not met.' : [entry.rawAttack ? `+${entry.rawAttack} true raw attack` : '', entry.affinity ? `${percentage(entry.affinity)} affinity` : ''].filter(Boolean).join(' · ')}
                </p>
              </div>
            )
          })}
        </div>
      )}
      {!!unsupported.length && (
        <details className="mt-4 text-xs text-[#777b82]">
          <summary className="cursor-pointer">Other equipped skills are not simulated here ({unsupported.length})</summary>
          <ul className="mt-2 space-y-1">
            {unsupported.map(([id]) => <li key={id}>{skillById.get(id)?.name ?? id}</li>)}
          </ul>
        </details>
      )}
    </div>
  )
}

export default OffensiveSimulationPanel
