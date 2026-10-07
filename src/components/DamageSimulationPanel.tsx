import { useTranslation } from '../i18n/useTranslation'
import { useState } from 'react'
import type { Weapon } from '../types/armor'
import type { CalculatedSkills } from '../types/calculatedSkill'
import type { SkillSimulationConditions } from '../types/skillSimulation'
import type { SharpnessColor, SpiritLevel } from '../types/damageSimulation'
import { damageMonsters, longSwordAttacks } from '../data/damageSimulation'
import { calculateLongSwordDamage, sharpnessMultipliers, spiritMultipliers, supportedDamageSkills } from '../engine/longSwordDamage'
import { skills as definitions } from '../data/skills'
import SkillTooltip from './SkillTooltip'

const controlClass = 'mt-1 block w-full px-2 py-2 text-sm focus:border-hunter-gold'
const skillById = new Map(definitions.map((entry) => [entry.id, entry]))
const titleCase = (value: string) => value[0].toUpperCase() + value.slice(1)

export default function DamageSimulationPanel({ weapon, skills, conditions }: {
  weapon: Weapon | null; skills: CalculatedSkills; conditions: SkillSimulationConditions
}) {
  const { t } = useTranslation()
  const [monsterId, setMonsterId] = useState(damageMonsters[0].id)
  const [partId, setPartId] = useState('head')
  const [attackId, setAttackId] = useState(longSwordAttacks[0].id)
  const [sharpness, setSharpness] = useState<SharpnessColor>('white')
  const [spirit, setSpirit] = useState<SpiritLevel>('none')
  const [sweetspot, setSweetspot] = useState(false)
  const monster = damageMonsters.find((entry) => entry.id === monsterId) ?? damageMonsters[0]
  const part = monster.parts.find((entry) => entry.id === partId) ?? monster.parts[0]
  const attack = longSwordAttacks.find((entry) => entry.id === attackId) ?? longSwordAttacks[0]
  const wounded = conditions.target === 'wounded-weak'
  const damage = calculateLongSwordDamage(weapon, skills, conditions, monster, part, attack, { sharpness, spirit, wounded, sweetspot })
  const results = damage ? [
    { label: 'Normal', hit: damage.normal },
    { label: damage.affinity < 0 ? 'Feeble' : 'Critical', hit: damage.affinity < 0 ? damage.feeble : damage.critical },
    { label: 'Average', hit: damage.average },
  ] : []
  const notSimulated = Object.entries(skills).filter(([id, entry]) => entry.level > 0 && !supportedDamageSkills.has(id) && id !== 'inheritance' && !skillById.get(id)?.unlocksSkillId)

  return (
    <section className="hunter-panel hunter-damage min-w-0" aria-labelledby="damage-title">
      <h2 id="damage-title" className="hunter-panel-heading font-semibold">{t("Damage Simulator")} <span className="text-xs font-normal text-hunter-muted">{t("Long Sword · Single hit")}</span></h2>
      <div className="hunter-damage-content">
        {!damage ? <p className="py-3 text-sm text-hunter-muted">{weapon ? t("This first version supports Long Sword only. Equip a Long Sword to simulate damage.") : t("Equip a Long Sword to simulate damage.")}</p> : <>
          <p className="mb-3 text-xs text-hunter-muted">{t("Uses the current build and shared manual conditions. Weakness Exploit follows the selected monster part automatically.")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-hunter-muted">{t("Monster")}{' '}<select aria-label={t("Damage monster")} className={controlClass} value={monster.id} onChange={(event) => { setMonsterId(event.target.value); setPartId('head') }}>
                {damageMonsters.map((entry) => <option key={entry.id} value={entry.id}>{t(entry.name)}</option>)}
              </select>
            </label>
            <label className="text-sm text-hunter-muted">{t("Part (unbroken)")}{' '}<select aria-label={t("Damage monster part")} className={controlClass} value={part.id} onChange={(event) => setPartId(event.target.value)}>
                {monster.parts.map((entry) => <option key={entry.id} value={entry.id}>{t(entry.name)}</option>)}
              </select>
            </label>
            <label className="text-sm text-hunter-muted sm:col-span-2">{' '}{t("Attack")}{' '}<select aria-label={t("Long Sword attack")} className={controlClass} value={attack.id} onChange={(event) => setAttackId(event.target.value)}>
                {longSwordAttacks.map((entry) => <option key={entry.id} value={entry.id}>{t(entry.name)}</option>)}
              </select>
            </label>
            <label className="text-sm text-hunter-muted">{t("Sharpness (manual)")}{' '}<select aria-label={t("Damage sharpness")} className={controlClass} value={sharpness} onChange={(event) => setSharpness(event.target.value as SharpnessColor)}>
                {(Object.keys(sharpnessMultipliers) as SharpnessColor[]).map((entry) => <option key={entry} value={entry}>{t(titleCase(entry))}</option>)}
              </select>
            </label>
            <label className="text-sm text-hunter-muted">{t("Spirit level")}{' '}<select aria-label={t("Spirit level")} className={controlClass} value={spirit} onChange={(event) => setSpirit(event.target.value as SpiritLevel)}>
                {(Object.keys(spiritMultipliers) as SpiritLevel[]).map((entry) => <option key={entry} value={entry}>{t(titleCase(entry))}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={sweetspot} onChange={(event) => setSweetspot(event.target.checked)} className="accent-hunter-gold" />{t("Middle-of-blade hit (+3% physical)")}</label>
          </div>
          <div className="mt-4" aria-live="polite" aria-atomic="true">
            <p className="text-xs text-hunter-muted">{t(monster.name)} · {t(part.name)} · {wounded ? t("Wounded") : t("Unwounded")} · {conditions.monsterEnraged ? t("Enraged") : t("Not enraged")}</p>
            <p className="mt-1 text-xs text-hunter-muted">{t("Affinity for this hit:")} {damage.affinity}{t("% · Weakness Exploit:")} {damage.weakSpot ? t("weak spot") : t("not a weak spot")}</p>
            <dl className="hunter-damage-results mt-3 grid grid-cols-3 gap-2">
              {results.map(({ label, hit }) => (
                <div key={label} className="min-w-0 rounded bg-hunter-inset p-2 sm:p-3">
                  <dt className="text-xs text-hunter-muted">{t(label)}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-hunter-gold">{label === 'Average' ? hit.total.toFixed(1) : hit.total}</dd>
                  <dd className="mt-1 text-xs text-hunter-muted">{label === 'Average' ? hit.physical.toFixed(1) : hit.physical} {t("physical")}<br />{label === 'Average' ? hit.elemental.toFixed(1) : hit.elemental} {t(damage.element ?? "element")}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-hunter-muted">{t("Average includes affinity probability; it is not damage per second.")}</p>
          </div>
          <details className="mt-4 text-xs text-hunter-muted">
            <summary className="cursor-pointer">{t("Calculation details & limits")}</summary>
            <div className="mt-2 space-y-2">
              <p>{t("True raw after Spirit:")} {damage.trueRaw} {t("· Attack value:")} {attack.motionValue} {t("· Sever hitzone:")} {damage.effectiveSever}{damage.element ? t(" · {0} hitzone: {1} · True element: {2}", [titleCase(damage.element), part.elements[damage.element], damage.trueElement]) : ''}</p>
              <p>{t("Basic single-hit attacks only. Sharpness is chosen manually and is not checked against the weapon. Low sharpness assumes mid-swing contact. Critical Draw applies only to Step Slash when enabled in Manual Conditions.")}</p>
              <p>{t("Includes supported Attack / Affinity skills, Critical Boost, elemental attack skills, Free Elem, Non-elemental Boost and Critical Element / True Critical Element. Uses ordinary unbroken parts, quest damage multiplier ×1 and the monster’s enrage damage modifier.")}</p>
              <p>{t("Excludes status procs (poison/blast), augments, custom upgrades, awakened abilities, items, food, mantles and other skill effects. Game rounding can differ by one damage at floating-point boundaries. Simulation choices are local and are not shared.")}</p>
              {!!notSimulated.length && <div><p>{t("Other equipped skills are not applied here:")}</p><ul className="mt-1 space-y-1">{notSimulated.map(([id, entry]) => <li key={id}>{skillById.get(id) ? <SkillTooltip definition={skillById.get(id)!} level={entry.level} /> : id}</li>)}</ul></div>}
              <p><a className="underline" href="https://bit.ly/MHWIWeaponAttackTables" target="_blank" rel="noreferrer">{t("Iceborne attack tables")}</a> · <a className="underline" href="https://bit.ly/MHWIDamageFormula" target="_blank" rel="noreferrer">{t("Damage formula")}</a> · <a className="underline" href={monster.source} target="_blank" rel="noreferrer">{t("Monster data")}</a></p>
            </div>
          </details>
        </>}
      </div>
    </section>
  )
}
