import { useTranslation } from '../i18n/useTranslation'
import type { Dispatch, SetStateAction } from 'react'
import type { SkillSimulationConditions } from '../types/skillSimulation'
import { defaultSimulationConditions } from '../engine/skillEffects'

export interface SimulationConditionsProps {
  conditions: SkillSimulationConditions
  setConditions: Dispatch<SetStateAction<SkillSimulationConditions>>
}
const controlClass = 'mt-1 block w-full rounded-md border border-hunter-border bg-hunter-ink px-2 py-2 text-sm text-hunter-text focus:border-hunter-gold'

export default function SimulationConditions({ conditions, setConditions, disabled = false, automaticTarget = false }: SimulationConditionsProps & { disabled?: boolean; automaticTarget?: boolean }) {
  const { t } = useTranslation()
  const update = <K extends keyof SkillSimulationConditions>(key: K, value: SkillSimulationConditions[K]) => setConditions((current) => ({ ...current, [key]: value }))
  return (
      <fieldset disabled={disabled} className="hunter-conditions mt-4 grid gap-3 sm:grid-cols-2 disabled:opacity-50">
        <legend className="mb-2 text-sm font-semibold">{t("Manual Conditions")}</legend>
        <div className="hunter-condition-grid">
        {automaticTarget ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={conditions.target === 'wounded-weak'} onChange={(event) => update('target', event.target.checked ? 'wounded-weak' : 'normal')} className="accent-hunter-gold" />{t("Wounded monster part")}</label> : <label className="hunter-target block text-sm text-hunter-muted">{' '}{t("Target (Weakness Exploit)")}{' '}<select aria-label={t("Target (Weakness Exploit)")} value={conditions.target} onChange={(event) => update('target', event.target.value as SkillSimulationConditions['target'])} className={controlClass}>
            <option value="normal">{t("Normal hit")}</option>
            <option value="weak">{t("Weak spot")}</option>
            <option value="wounded-weak">{t("Wounded weak spot")}</option>
          </select>
        </label>}
        <label className="hunter-health block text-sm text-hunter-muted">{' '}{t("Health (Peak Performance / Resentment)")}{' '}<select aria-label={t("Health (Peak Performance / Resentment)")} value={conditions.health} onChange={(event) => update('health', event.target.value as SkillSimulationConditions['health'])} className={controlClass}>
            <option value="normal">{t("Normal")}</option>
            <option value="full">{t("Full health")}</option>
            <option value="recoverable">{t("Recoverable damage (red health)")}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.monsterEnraged} onChange={(event) => update('monsterEnraged', event.target.checked)} className="accent-hunter-gold" />{' '}{t("Monster enraged (Agitator)")}{' '}</label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.maximumMightActive} onChange={(event) => update('maximumMightActive', event.target.checked)} className="accent-hunter-gold" />{' '}{t("Maximum Might requirement met")}{' '}</label>
        <p className="text-xs text-hunter-muted sm:col-span-2">{t("Includes any required stamina duration; no timer is simulated.")}</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.latentPowerActive} onChange={(event) => update('latentPowerActive', event.target.checked)} className="accent-hunter-gold" />{' '}{t("Latent Power active")}{' '}</label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conditions.drawAttack} onChange={(event) => update('drawAttack', event.target.checked)} className="accent-hunter-gold" />{' '}{t("Draw attack (Critical Draw)")}{' '}</label>
        <button type="button" onClick={() => setConditions(defaultSimulationConditions())} className="rounded-md border border-hunter-border px-3 py-2 text-xs text-hunter-muted hover:border-hunter-gold">{t("Reset Conditions")}</button>
        </div>
      </fieldset>
  )
}
