import { useEffect, useRef, useState } from 'react'
import type { ArmorPiece, Weapon } from '../types/armor'
import type { SavedBuildData } from '../types/savedBuild'
import type { BuildGeneratorResponse, BuildGeneratorResult, SkillRequirement } from '../types/buildGenerator'
import { skills } from '../data/skills'
import { armors } from '../data/armor'
import { charms } from '../data/charms'
import { decorations } from '../data/decorations'
import SkillTooltip from './SkillTooltip'

interface BuildGeneratorPanelProps {
  weapon: Weapon | null
  onSelectWeapon: () => void
  onApply: (build: SavedBuildData) => void
}

const skillOptions = [...skills].sort((a, b) => a.name.localeCompare(b.name))
const skillById = new Map(skills.map((skill) => [skill.id, skill]))
const armorById = new Map(armors.map((armor) => [armor.id, armor]))
const charmById = new Map(charms.map((charm) => [charm.id, charm]))
const decorationById = new Map(decorations.map((decoration) => [decoration.id, decoration]))
const controlClass = 'rounded-md border border-[#30343a] bg-[#111214] px-3 py-2 text-sm text-[#e7e4da] outline-none focus:border-[#c99a45] disabled:opacity-50'

function BuildGeneratorPanel({ weapon, onSelectWeapon, onApply }: BuildGeneratorPanelProps) {
  const [rank, setRank] = useState<ArmorPiece['rank']>('master')
  const [requirements, setRequirements] = useState<SkillRequirement[]>([])
  const [newSkillId, setNewSkillId] = useState('')
  const [storedRunning, setRunning] = useState(false)
  const [storedResult, setResult] = useState<BuildGeneratorResult | null>(null)
  const [storedError, setError] = useState<string | null>(null)
  const [searchWeaponId, setSearchWeaponId] = useState<string | null>(null)
  const [previousWeaponId, setPreviousWeaponId] = useState(weapon?.id)
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => () => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [weapon?.id])

  // Preserve the form, but discard results and running state when the weapon changes.
  if (previousWeaponId !== weapon?.id) {
    setPreviousWeaponId(weapon?.id)
    setSearchWeaponId(null)
    setResult(null)
    setError(null)
    setRunning(false)
    setAppliedIndex(null)
  }

  const currentSearch = searchWeaponId === weapon?.id
  const running = currentSearch && storedRunning
  const result = currentSearch ? storedResult : null
  const error = currentSearch ? storedError : null

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
  const generate = () => {
    if (!weapon || !requirements.length || running) return
    clearResult()
    setSearchWeaponId(weapon.id)
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
      worker.postMessage({ weaponId: weapon.id, rank, skills: requirements })
    } catch {
      setError('Could not start build generation. Please try again.')
      cancel()
    }
  }

  return (
    <section className="mb-6 rounded-lg border border-[#30343a] bg-[#191b1f] p-5" aria-labelledby="generator-title">
      <h2 id="generator-title" className="text-lg font-semibold">Build Generator</h2>
      <p className="mt-2 text-sm text-[#9b9b95]">
        Find up to 3 builds that meet your minimum skill levels with your chosen weapon.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded bg-[#15171a] p-3">
        <div>
          <p className="text-xs text-[#9b9b95]">Fixed weapon</p>
          <p className="mt-1 text-sm">{weapon?.name ?? 'Select a weapon before generating.'}</p>
        </div>
        <button type="button" onClick={onSelectWeapon} disabled={running} className={`${controlClass} hover:border-[#c99a45]`}>
          {weapon ? 'Change Weapon' : 'Select Weapon'}
        </button>
      </div>
      <label className="mt-4 block text-sm text-[#9b9b95]">
        Armor Rank
        <select value={rank} disabled={running} onChange={(event) => {
          setRank(event.target.value as ArmorPiece['rank'])
          clearResult()
        }} className={`${controlClass} mt-1 block w-full sm:w-56`}>
          <option value="low">Low Rank</option>
          <option value="high">High Rank</option>
          <option value="master">Master Rank</option>
        </select>
      </label>
      <p className="mt-2 text-xs text-[#777b82]">
        Only armor of this rank is used. Charms and decorations use the full catalog, with unlimited decoration copies.
      </p>

      <div className="mt-5">
        <h3 className="text-sm font-semibold">Required Skills</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <select aria-label="Skill to add" value={newSkillId} disabled={running} onChange={(event) => setNewSkillId(event.target.value)} className={`${controlClass} min-w-0 flex-1`}>
            <option value="">Choose a skill...</option>
            {skillOptions.filter((skill) => !requirements.some((entry) => entry.skillId === skill.id)).map((skill) => (
              <option key={skill.id} value={skill.id}>{skill.name}</option>
            ))}
          </select>
          <button type="button" disabled={running || !newSkillId} className={`${controlClass} hover:border-[#c99a45]`} onClick={() => {
            setRequirements([...requirements, { skillId: newSkillId, level: 1 }])
            setNewSkillId('')
            clearResult()
          }}>Add Skill</button>
        </div>
        {!requirements.length && <p className="mt-3 text-sm text-[#777b82]">Add at least one skill to start.</p>}
        <div className="mt-3 space-y-2">
          {requirements.map((entry) => {
            const definition = skillById.get(entry.skillId)!
            const needsSecret = definition.secret !== undefined && entry.level > definition.maxLevel - definition.secret
            return (
              <div key={entry.skillId} className="flex flex-wrap items-center justify-between gap-3 rounded bg-[#15171a] p-3">
                <div>
                  <SkillTooltip definition={definition} level={entry.level} className="text-sm" />
                  {needsSecret && <p className="mt-1 text-xs text-[#c99a45]">Requires Secret unlock or Inheritance.</p>}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#9b9b95]">
                    Minimum level
                    <select aria-label={`${definition.name} minimum level`} value={entry.level} disabled={running} className={`${controlClass} ml-2`} onChange={(event) => {
                      setRequirements(requirements.map((requirement) => requirement.skillId === entry.skillId ? { ...requirement, level: Number(event.target.value) } : requirement))
                      clearResult()
                    }}>
                      {Array.from({ length: definition.maxLevel }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
                    </select>
                  </label>
                  <button type="button" aria-label={`Remove ${definition.name}`} disabled={running} className="rounded px-2 py-2 text-sm text-[#9b9b95] hover:text-red-400 disabled:opacity-50" onClick={() => {
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
        <button type="button" disabled={!weapon || !requirements.length || running} onClick={generate} className="rounded-md border border-[#c99a45] px-4 py-2 text-sm font-semibold text-[#c99a45] hover:bg-[#c99a45] hover:text-[#111214] disabled:cursor-not-allowed disabled:opacity-40">
          {running ? 'Generating...' : 'Generate Builds'}
        </button>
        {running && <button type="button" onClick={cancel} className={controlClass}>Cancel</button>}
      </div>
      <div aria-live="polite" className="mt-3 text-sm text-[#9b9b95]">
        {running && <p>Searching combinations. You can cancel at any time.</p>}
        {error && <p className="text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <p>{result.builds.length} valid build{result.builds.length === 1 ? '' : 's'} found.</p>
            {result.status === 'limit' && <p className="mt-1 text-[#c99a45]">Search limit reached. More solutions may exist; this does not mean the request is impossible.</p>}
            {result.status === 'exhausted' && !result.builds.length && <p className="mt-1">No combination in the selected armor rank meets all requested skills.</p>}
            {!!result.builds.length && <p className="mt-1 text-xs">All results meet every minimum. Results are not ranked by damage.</p>}
          </>
        )}
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {result?.builds.map((candidate, index) => (
          <article key={index} className="rounded-md border border-[#30343a] bg-[#111214] p-4">
            <h3 className="font-semibold">Build {index + 1}</h3>
            <ul className="mt-3 space-y-1 text-sm text-[#9b9b95]">
              {Object.entries(candidate.build.armor).map(([slot, id]) => <li key={slot}>{armorById.get(id!)?.name ?? id}</li>)}
              <li>Charm: {candidate.build.charmId ? charmById.get(candidate.build.charmId)?.name : 'None'}</li>
              <li>{candidate.build.decorations.length} decorations</li>
            </ul>
            {!!candidate.build.decorations.length && (
              <ul className="mt-2 space-y-1 text-xs text-[#9b9b95]">
                {[...new Set(candidate.build.decorations.map((entry) => entry.decorationId))].map((id) => (
                  <li key={id}>{candidate.build.decorations.filter((entry) => entry.decorationId === id).length} × {decorationById.get(id)?.name ?? id}</li>
                ))}
              </ul>
            )}
            <ul className="mt-3 space-y-1 text-sm text-[#c99a45]">
              {requirements.map((entry) => <li key={entry.skillId}>{skillById.get(entry.skillId)?.name}: Lv {candidate.skills[entry.skillId]?.level ?? 0} / {entry.level} required</li>)}
            </ul>
            <button type="button" className={`${controlClass} mt-4 w-full hover:border-[#c99a45]`} onClick={() => {
              onApply(candidate.build)
              setAppliedIndex(index)
            }}>{appliedIndex === index ? 'Applied to Editor' : 'Apply to Editor'}</button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default BuildGeneratorPanel
