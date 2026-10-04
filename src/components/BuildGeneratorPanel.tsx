import { useEffect, useRef, useState } from 'react'
import type { ArmorPiece, ArmorSlot, Weapon, WeaponType } from '../types/armor'
import type { SavedBuildData } from '../types/savedBuild'
import type { BuildGeneratorResponse, BuildGeneratorResult, SkillRequirement } from '../types/buildGenerator'
import { skills } from '../data/skills'
import { armors } from '../data/armor'
import { charms } from '../data/charms'
import { decorations } from '../data/decorations'
import { weapons } from '../data/weapons'
import { calculateArmorStats } from '../engine/buildCalculator'
import SkillTooltip from './SkillTooltip'

interface BuildGeneratorPanelProps {
  weapon: Weapon | null
  selectedArmor: Partial<Record<ArmorSlot, ArmorPiece>>
  fixedArmorSlots: ReadonlySet<ArmorSlot>
  onWeaponTypeChange: (type: WeaponType) => void
  onApply: (build: SavedBuildData) => void
}

const skillOptions = [...skills].sort((a, b) => a.name.localeCompare(b.name))
const skillById = new Map(skills.map((skill) => [skill.id, skill]))
const armorById = new Map(armors.map((armor) => [armor.id, armor]))
const charmById = new Map(charms.map((charm) => [charm.id, charm]))
const decorationById = new Map(decorations.map((decoration) => [decoration.id, decoration]))
const weaponById = new Map(weapons.map((weapon) => [weapon.id, weapon]))
const weaponTypeNames: Record<WeaponType, string> = {
  'great-sword': 'Great Sword', 'long-sword': 'Long Sword', 'sword-and-shield': 'Sword & Shield',
  'dual-blades': 'Dual Blades', hammer: 'Hammer', 'hunting-horn': 'Hunting Horn',
  lance: 'Lance', gunlance: 'Gunlance', 'switch-axe': 'Switch Axe', 'charge-blade': 'Charge Blade',
  'insect-glaive': 'Insect Glaive', 'light-bowgun': 'Light Bowgun', 'heavy-bowgun': 'Heavy Bowgun', bow: 'Bow',
}
const weaponTypes = Object.keys(weaponTypeNames) as WeaponType[]
const armorSlots: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']
const armorSlotNames: Record<ArmorSlot, string> = {
  head: 'Head', chest: 'Chest', arms: 'Arms', waist: 'Waist', legs: 'Legs',
}
const controlClass = 'rounded-md border border-hunter-border bg-hunter-ink px-3 py-2 text-sm text-hunter-text outline-none focus:border-hunter-gold disabled:opacity-50'

function BuildGeneratorPanel({ weapon, selectedArmor, fixedArmorSlots, onApply, onWeaponTypeChange }: BuildGeneratorPanelProps) {
  const [weaponType, setWeaponType] = useState<WeaponType>(weapon?.type ?? 'great-sword')
  const [rank, setRank] = useState<ArmorPiece['rank']>('master')
  const [requirements, setRequirements] = useState<SkillRequirement[]>([])
  const [newSkillQuery, setNewSkillQuery] = useState('')
  const [storedRunning, setRunning] = useState(false)
  const [storedResult, setResult] = useState<BuildGeneratorResult | null>(null)
  const [storedError, setError] = useState<string | null>(null)
  const [searchConfiguration, setSearchConfiguration] = useState<string | null>(null)
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const fixedArmor = armorSlots.reduce<Partial<Record<ArmorSlot, string>>>((fixed, slot) => {
    const piece = selectedArmor[slot]
    if (piece && fixedArmorSlots.has(slot)) fixed[slot] = piece.id
    return fixed
  }, {})
  const fixedPieces = armorSlots.flatMap((slot) => {
    const piece = selectedArmor[slot]
    return piece && fixedArmorSlots.has(slot) ? [{ slot, piece }] : []
  })
  const rankMismatches = fixedPieces.filter(({ piece }) => piece.rank !== rank)
  const fixedArmorConfiguration = armorSlots.map((slot) => `${slot}:${fixedArmor[slot] ?? ''}`).join('|')
  const requestConfiguration = `${rank}:${fixedArmorConfiguration}`

  useEffect(() => () => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  const currentSearch = searchConfiguration === requestConfiguration
  const running = storedRunning
  const result = currentSearch ? storedResult : null
  const error = currentSearch ? storedError : null
  const normalizedSkillQuery = newSkillQuery.trim().toLowerCase()
  const availableSkills = skillOptions
    .filter((skill) => !requirements.some((entry) => entry.skillId === skill.id))
    .filter((skill) => !normalizedSkillQuery || skill.name.toLowerCase().includes(normalizedSkillQuery))
  const matchingSkills = availableSkills.slice(0, 6)

  const clearResult = () => {
    setResult(null)
    setError(null)
    setAppliedIndex(null)
  }
  const cancel = () => {
    workerRef.current?.terminate()
    workerRef.current = null
    setRunning(false)
  }
  const addSkill = (skillId: string) => {
    setRequirements([...requirements, { skillId, level: 1 }])
    setNewSkillQuery('')
    clearResult()
  }
  const generate = () => {
    if (!requirements.length || running || rankMismatches.length) return
    clearResult()
    setSearchConfiguration(requestConfiguration)
    setRunning(true)
    try {
      const worker = new Worker(new URL('../workers/buildGenerator.worker.ts', import.meta.url), { type: 'module' })
      workerRef.current = worker
      worker.onmessage = (event: MessageEvent<BuildGeneratorResponse>) => {
        if (workerRef.current !== worker) return
        if ('error' in event.data) setError(event.data.error)
        else setResult(event.data.result)
        cancel()
      }
      worker.onerror = () => {
        if (workerRef.current !== worker) return
        setError('Could not generate builds. Please try again.')
        cancel()
      }
      worker.postMessage({ rank, skills: requirements, fixedArmor })
    } catch {
      setError('Could not start build generation. Please try again.')
      cancel()
    }
  }

  return (
    <section className="hunter-generator-content border-t border-hunter-border p-5" aria-labelledby="generator-title">
      <p className="text-sm text-hunter-muted">
        Find up to 3 different armor layouts that meet every skill minimum without a weapon.
      </p>
      <h3 className="mt-4 text-sm font-semibold">1. Choose rank and manual weapon filter</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-hunter-muted">
          Manual Weapon Type
          <select value={weaponType} disabled={running} onChange={(event) => {
            setWeaponType(event.target.value as WeaponType)
            onWeaponTypeChange(event.target.value as WeaponType)
          }} className={`${controlClass} mt-1 block w-full`}>
            {weaponTypes.map((type) => <option key={type} value={type}>{weaponTypeNames[type]}</option>)}
          </select>
        </label>
        <label className="block text-sm text-hunter-muted">
          Armor Rank
          <select value={rank} disabled={running} onChange={(event) => {
            setRank(event.target.value as ArmorPiece['rank'])
            clearResult()
          }} className={`${controlClass} mt-1 block w-full`}>
            <option value="low">Low Rank</option>
            <option value="high">High Rank</option>
            <option value="master">Master Rank</option>
          </select>
        </label>
      </div>
      <p className="mt-2 text-xs text-hunter-muted">
        Armor uses this rank. Weapon type only presets the manual weapon selector; weapon skills, slots and set bonuses are excluded. Charms and decorations use the full catalog, with unlimited decoration copies.
      </p>
      <p className="mt-1 text-xs text-hunter-muted">
        Select armor in Equipment and check “Keep for generated builds” to hold those pieces fixed.
      </p>
      {!!fixedPieces.length && <p className="mt-1 text-xs text-hunter-gold">
        Fixed armor: {fixedPieces.map(({ slot, piece }) => `${armorSlotNames[slot]} — ${piece.name}`).join(' · ')}
      </p>}
      {!!rankMismatches.length && <p className="mt-2 text-sm text-red-300" role="alert">
        Fixed armor must match {rank === 'master' ? 'Master' : rank === 'high' ? 'High' : 'Low'} Rank. Change the rank or uncheck the mismatched piece to generate builds.
      </p>}

      <div className="mt-5">
        <h3 className="text-sm font-semibold">2. Add required skills</h3>
        <label className="mt-2 block text-sm text-hunter-muted">
          Search skills by name
          <input type="search" aria-label="Search skills by name" autoComplete="off" value={newSkillQuery} disabled={running} onChange={(event) => setNewSkillQuery(event.target.value)} placeholder="For example: Critical Eye" className={`${controlClass} mt-1 block w-full`} />
        </label>
        {normalizedSkillQuery && (
          <div className="mt-2 space-y-2 rounded bg-hunter-inset p-2" aria-label="Matching skills">
            {matchingSkills.length ? matchingSkills.map((skill) => (
              <div key={skill.id} className="flex items-center justify-between gap-3 rounded border border-hunter-border/50 px-3 py-2">
                <div className="min-w-0">
                  <SkillTooltip definition={skill} level={1} className="text-sm" />
                  <p className="text-xs text-hunter-muted">Maximum level: {skill.maxLevel}</p>
                </div>
                <button type="button" aria-label={`Add ${skill.name}`} disabled={running} className={`${controlClass} shrink-0 hover:border-hunter-gold`} onClick={() => addSkill(skill.id)}>Add</button>
              </div>
            )) : <p className="px-2 py-1 text-sm text-hunter-muted">No unselected skills match that name.</p>}
            {availableSkills.length > matchingSkills.length && <p className="px-2 text-xs text-hunter-muted">Showing the first {matchingSkills.length} matches. Refine your search to see other skills.</p>}
          </div>
        )}
        {!requirements.length && <p className="mt-3 text-sm text-hunter-muted">Add at least one skill to start.</p>}
        <div className="mt-3 space-y-2">
          {requirements.map((entry) => {
            const definition = skillById.get(entry.skillId)!
            const needsSecret = definition.secret !== undefined && entry.level > definition.maxLevel - definition.secret
            return (
              <div key={entry.skillId} className="flex flex-wrap items-center justify-between gap-3 rounded bg-hunter-inset p-3">
                <div>
                  <SkillTooltip definition={definition} level={entry.level} className="text-sm" />
                  {needsSecret && <p className="mt-1 text-xs text-hunter-gold">Requires Secret unlock or Inheritance.</p>}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-hunter-muted">
                    Minimum level
                    <select aria-label={`${definition.name} minimum level`} value={entry.level} disabled={running} className={`${controlClass} ml-2`} onChange={(event) => {
                      setRequirements(requirements.map((requirement) => requirement.skillId === entry.skillId ? { ...requirement, level: Number(event.target.value) } : requirement))
                      clearResult()
                    }}>
                      {Array.from({ length: definition.maxLevel }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
                    </select>
                  </label>
                  <button type="button" aria-label={`Remove ${definition.name}`} disabled={running} className="rounded px-2 py-2 text-sm text-hunter-muted hover:text-red-400 disabled:opacity-50" onClick={() => {
                    setRequirements(requirements.filter((requirement) => requirement.skillId !== entry.skillId))
                    clearResult()
                  }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!requirements.length || running || rankMismatches.length > 0} onClick={generate} className="rounded-md border border-hunter-gold px-4 py-2 text-sm font-semibold text-hunter-gold hover:bg-hunter-gold hover:text-hunter-ink disabled:cursor-not-allowed disabled:opacity-40">
          {running ? 'Generating...' : '3. Generate Builds'}
        </button>
        {running && <button type="button" onClick={cancel} className={controlClass}>Cancel</button>}
      </div>
      <div aria-live="polite" className="mt-3 text-sm text-hunter-muted">
        {running && <p>Searching combinations. You can cancel at any time.</p>}
        {error && <p className="text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <p>{result.builds.length} valid build{result.builds.length === 1 ? '' : 's'} found.</p>
            {result.status === 'limit' && <p className="mt-1 text-hunter-gold">Search limit reached. More solutions may exist; this does not mean the request is impossible.</p>}
            {result.status === 'exhausted' && !result.builds.length && <p className="mt-1">No weapon-independent armor combination was found for these skills and rank.</p>}
            {!!result.builds.length && <p className="mt-1 text-xs">All results meet every minimum without a weapon. Different armor families in each slot define a variant; alpha/beta changes alone do not. Results are not ranked by damage.</p>}
          </>
        )}
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {result?.builds.map((candidate, index) => {
          const candidateWeapon = candidate.build.weaponId ? weaponById.get(candidate.build.weaponId) : undefined
          const candidateArmor = Object.values(candidate.build.armor)
            .map((id) => armorById.get(id!))
            .filter((armor): armor is ArmorPiece => armor !== undefined)
          const armorStats = calculateArmorStats(candidateArmor)
          const reference = result.builds[0]
          const comparing = index > 0
          const changedSlots = armorSlots.filter((slot) => candidate.build.armor[slot] !== reference.build.armor[slot])
          const charmChanged = candidate.build.charmId !== reference.build.charmId
          const freeSlots = [
            ...(candidateWeapon?.slots.map((slot, slotIndex) => ({ size: slot.size, used: candidate.build.decorations.some((entry) => entry.location.type === 'weapon' && entry.location.slotIndex === slotIndex) })) ?? []),
            ...armorSlots.flatMap((armorSlot) => {
              const piece = armorById.get(candidate.build.armor[armorSlot] ?? '')
              return piece?.slots.map((slot, slotIndex) => ({ size: slot.size, used: candidate.build.decorations.some((entry) => entry.location.type === 'armor' && entry.location.slot === armorSlot && entry.location.slotIndex === slotIndex) })) ?? []
            }),
          ].filter((slot) => !slot.used)
          const requiredSkillIds = new Set(requirements.map((entry) => entry.skillId))
          const extraSkills = Object.entries(candidate.skills).flatMap(([skillId, value]) => {
            const definition = skillById.get(skillId)
            return value.level > 0 && !requiredSkillIds.has(skillId) && definition
              ? [{ definition, ...value }]
              : []
          }).sort((a, b) => a.definition.name.localeCompare(b.definition.name))

          return (
            <article key={index} className="rounded-md border border-hunter-border bg-hunter-ink p-4">
              <h3 className="font-semibold">Build {index + 1}</h3>
              <p className="mt-1 text-xs text-hunter-muted">{comparing ? 'Compared with Build 1' : result.builds.length > 1 ? 'Reference for comparison' : 'All requested skill minimums met'}</p>
              {comparing && <p className="mt-2 text-xs text-hunter-gold">
                {changedSlots.length} armor piece{changedSlots.length === 1 ? '' : 's'} changed{charmChanged ? ' · Different charm' : ''}
              </p>}
              <ul className="mt-3 space-y-1 text-sm text-hunter-muted">
                <li className="text-hunter-gold">Weapon-independent · choose your weapon in Equipment</li>
                {candidateWeapon && <li>Attack {candidateWeapon.attack} · Affinity {candidateWeapon.affinity > 0 ? '+' : ''}{candidateWeapon.affinity}%</li>}
                {!!candidateWeapon?.elements.length && <li>{candidateWeapon.elements.map((element) => `${element.type} ${element.damage}${element.hidden ? ' (hidden)' : ''}`).join(' · ')}</li>}
                {armorSlots.map((slot) => <li key={slot} className={comparing && changedSlots.includes(slot) ? 'text-hunter-gold' : ''}>
                  {armorById.get(candidate.build.armor[slot] ?? '')?.name ?? 'None'}
                  {comparing && changedSlots.includes(slot) && <span className="ml-2 text-xs">({armorSlotNames[slot]} changed)</span>}
                </li>)}
                <li className={comparing && charmChanged ? 'text-hunter-gold' : ''}>Charm: {candidate.build.charmId ? charmById.get(candidate.build.charmId)?.name : 'None'}{comparing && charmChanged ? ' (changed)' : ''}</li>
                <li>{candidate.build.decorations.length} decorations</li>
              </ul>
              <div className="mt-3 border-t border-hunter-border pt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-hunter-muted">Free Decoration Slots</h4>
                <p className="mt-1 text-sm text-hunter-text">{freeSlots.length ? [4, 3, 2, 1].flatMap((size) => {
                  const count = freeSlots.filter((slot) => slot.size === size).length
                  return count ? [`${count} × size ${size}`] : []
                }).join(' · ') : 'No free slots'}</p>
              </div>
              {!!candidate.build.decorations.length && (
                <ul className="mt-2 space-y-1 text-xs text-hunter-muted">
                  {[...new Set(candidate.build.decorations.map((entry) => entry.decorationId))].map((id) => (
                    <li key={id}>{candidate.build.decorations.filter((entry) => entry.decorationId === id).length} × {decorationById.get(id)?.name ?? id}</li>
                  ))}
                </ul>
              )}
              <div className="mt-3 border-t border-hunter-border pt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-hunter-muted">Build Stats</h4>
                <p className="mt-1 text-sm text-hunter-text">
                  Defense: {armorStats.defense + (candidateWeapon?.defenseBonus ?? 0)}
                </p>
                <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {Object.entries(armorStats.resistances).map(([element, value]) => (
                    <div key={element} className="flex gap-1">
                      <dt className="capitalize text-hunter-muted">{element}</dt>
                      <dd className={value > 0 ? 'text-hunter-positive' : value < 0 ? 'text-hunter-negative' : 'text-hunter-muted'}>
                        {value > 0 ? `+${value}` : value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-hunter-gold">
                {requirements.map((entry) => <li key={entry.skillId}>{skillById.get(entry.skillId)?.name}: Lv {candidate.skills[entry.skillId]?.level ?? 0} / {entry.level} required</li>)}
              </ul>
              <div className="mt-3 border-t border-hunter-border pt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-hunter-muted">Extra Skills</h4>
                {extraSkills.length ? (
                  <ul className="mt-1 space-y-1 text-sm text-hunter-text">
                    {extraSkills.map(({ definition, level }) => {
                      const previous = reference.skills[definition.id]?.level ?? 0
                      const delta = level - previous
                      return <li key={definition.id} className="flex flex-wrap justify-between gap-x-2">
                        <SkillTooltip definition={definition} level={level} />
                        <span className="text-hunter-gold">Lv {level}{comparing && delta !== 0 && <span className="ml-2 text-xs text-hunter-muted">({previous === 0 ? 'new' : `${delta > 0 ? '+' : ''}${delta} vs Build 1`})</span>}</span>
                      </li>
                    })}
                  </ul>
                ) : <p className="mt-1 text-xs text-hunter-muted">None</p>}
                {comparing && Object.entries(reference.skills).some(([id, value]) => !requiredSkillIds.has(id) && value.level > 0 && !(candidate.skills[id]?.level > 0)) && <p className="mt-2 text-xs text-hunter-muted">
                  Not present here: {Object.entries(reference.skills).filter(([id, value]) => !requiredSkillIds.has(id) && value.level > 0 && !(candidate.skills[id]?.level > 0)).map(([id]) => skillById.get(id)?.name ?? id).join(', ')}
                </p>}
              </div>
              <button type="button" className={`${controlClass} mt-4 w-full hover:border-hunter-gold`} onClick={() => {
                onApply({ ...candidate.build, weaponId: weapon?.id ?? null })
                setAppliedIndex(index)
              }}>{appliedIndex === index ? 'Applied to Editor' : 'Apply to Editor'}</button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default BuildGeneratorPanel
