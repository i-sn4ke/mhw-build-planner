import type { Decoration } from './types/decoration'

import { useEffect, useRef, useState } from 'react'
import { useBuildStore } from './store/buildStore'

import ArmorSelector from './components/ArmorSelector'
import ArmorSlot from './components/ArmorSlot'
import SkillPanel from './components/SkillPanel'
import StatsPanel from './components/StatsPanel'
import OffensiveSimulationPanel from './components/OffensiveSimulationPanel'
import CharmStatsPanel from './components/CharmStatsPanel'
import DecorationSelector from './components/DecorationSelector'
import WeaponStatsPanel from './components/WeaponStatsPanel'
import SetBonusPanel from './components/SetBonusPanel'
import CharmSelector from './components/CharmSelector'
import WeaponSelector from './components/WeaponSelector'
import BuildGeneratorPanel from './components/BuildGeneratorPanel'
import hunterLogo from './assets/hunter/monster-hunter-logo.png'

import {calculateBuildStats,} from './engine/buildCalculator'

import { armors as armorDefinitions } from './data/armor'
import { weapons as weaponDefinitions } from './data/weapons'
import { decorations as decorationDefinitions } from './data/decorations'
import { skills } from './data/skills'
import { setBonuses as setBonusDefinitions } from './data/setBonuses'
import { charms as charmDefinitions } from './data/charms'

import { calculateSetBonuses } from './engine/setBonuses'
import {
  createShareUrl,
  getBuildFromShareUrl,
} from './engine/buildShare'
import {
  deserializeBuild,
  serializeBuild,
} from './engine/buildSerializer'
import { generateBuildFingerprint } from './engine/buildFingerprint'


import type {
  ArmorPiece,
  ArmorSlot as ArmorSlotType
} from './types/armor'

function App() {
  const selectedArmor = useBuildStore(
    (state) => state.selectedArmor,
  )
  const [fixedArmorSlots, setFixedArmorSlots] = useState<Set<ArmorSlotType>>(() => new Set())

  const setArmor = useBuildStore(
    (state) => state.setArmor,
  )

  const clearArmor = useBuildStore(
    (state) => state.clearArmor,
  )

  const selectedWeapon = useBuildStore(
    (state) => state.selectedWeapon,
  )

  const setWeapon = useBuildStore(
    (state) => state.setWeapon,
  )

  const decorations = useBuildStore(
    (state) => state.decorations,
  )

  const selectedCharm = useBuildStore(
    (state) => state.selectedCharm,
  )

  const setCharm = useBuildStore(
    (state) => state.setCharm,
  )

  const clearCharm = useBuildStore(
    (state) => state.clearCharm,
  )

  const loadBuild = useBuildStore(
    (state) => state.loadBuild,
  )

  const [selectorSlot, setSelectorSlot] =
    useState<ArmorSlotType | null>(null)

  const [isWeaponSelectorOpen, setIsWeaponSelectorOpen] =
    useState(false)

  const [decorationSelectorOpen, setDecorationSelectorOpen] =
    useState(false)

const [decorationTarget, setDecorationTarget] = useState<
  | {
      type: 'armor'
      slot: ArmorSlotType
      slotIndex: number
    }
  | {
      type: 'weapon'
      slotIndex: number
    }
  | null
>(null)

  const [isCharmSelectorOpen, setIsCharmSelectorOpen] =
    useState(false)

  const [buildFingerprint, setBuildFingerprint] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const hasLoadedSharedBuild = useRef(false)

  const addDecoration = useBuildStore(
    (state) => state.addDecoration,
  )

  const clearWeapon = useBuildStore(
    (state) => state.clearWeapon,
  )

  const removeDecoration = useBuildStore(
  (state) => state.removeDecoration,
)

  useEffect(() => {
    if (hasLoadedSharedBuild.current) {
      return
    }

    hasLoadedSharedBuild.current = true

    try {
      const savedBuild = getBuildFromShareUrl()

      if (!savedBuild) {
        return
      }

      const build = deserializeBuild(savedBuild, {
        armors: armorDefinitions,
        weapons: weaponDefinitions,
        charms: charmDefinitions,
        decorations: decorationDefinitions,
      })

      loadBuild(build)
    } catch (error) {
      console.error(
        'Failed to load shared build:',
        error,
      )
    }
  }, [loadBuild])

  const handleShareBuild = async () => {
    try {
      const savedBuild = serializeBuild({
        selectedArmor,
        selectedWeapon,
        selectedCharm,
        decorations,
      })

      const fingerprint = await generateBuildFingerprint(savedBuild)
      const shareUrl = createShareUrl(savedBuild)

      await navigator.clipboard.writeText(shareUrl)

      setBuildFingerprint(fingerprint)
      setShareStatus('copied')
    } catch (error) {
      console.error('Failed to share build:', error)
      setShareStatus('error')
    }
  }

  const handleSelectArmor = (armor: ArmorPiece) => {
    setArmor(armor)

    setSelectorSlot(null)
  }

  const toggleFixedArmor = (slot: ArmorSlotType) => {
    setFixedArmorSlots((current) => {
      const next = new Set(current)
      if (next.has(slot)) next.delete(slot)
      else next.add(slot)
      return next
    })
  }

  const clearArmorSlot = (slot: ArmorSlotType) => {
    clearArmor(slot)
    setFixedArmorSlots((current) => {
      if (!current.has(slot)) return current
      const next = new Set(current)
      next.delete(slot)
      return next
    })
  }


  const handleSelectDecoration = (decoration: Decoration) => {
  if (!decorationTarget) return

  addDecoration({
    decoration,
    location: decorationTarget,
  })

  setDecorationSelectorOpen(false)
  setDecorationTarget(null)
}

const armorPieces = Object.values(selectedArmor).filter(
  (armor): armor is ArmorPiece => armor !== undefined,
)

const activeSetBonuses = calculateSetBonuses(
  armorPieces,
  selectedWeapon,
  setBonusDefinitions,
)

const buildStats = calculateBuildStats(
  armorPieces,
  selectedWeapon,
  [
    ...armorPieces.map((armor) => armor.skills),
    ...(selectedWeapon ? [selectedWeapon.skills] : []),
    ...(selectedCharm ? [selectedCharm.skills] : []),
    ...decorations.map(
      (equipped) => equipped.decoration.skills,
    ),
  ],
  skills,
  setBonusDefinitions,
)

  return (
    <div className="hunter-planner min-h-screen text-hunter-text">
      <div className="hunter-board">
      <header className="hunter-header">
        <img src={hunterLogo} alt="Monster Hunter" className="hunter-logo" />
        <div className="hunter-brand-title">
          <h1>Build Planner</h1>
          <p>WORLD + ICEBORNE</p>
        </div>
        <div className="hunter-editor-toolbar flex flex-wrap items-center justify-end gap-3">
            {buildFingerprint && (
              <p className="mt-2 font-mono text-xs text-hunter-muted">
                Build ID: {buildFingerprint.slice(0, 12)}
              </p>
            )}
            {shareStatus === 'copied' && (
              <span className="text-sm text-hunter-muted">
                Link copied!
              </span>
            )}

            {shareStatus === 'error' && (
              <span className="text-sm text-red-400">
                Could not copy link.
              </span>
            )}

            <button
              type="button"
              onClick={handleShareBuild}
              className="rounded-md border border-hunter-gold px-4 py-2 text-sm font-semibold text-hunter-gold transition hover:bg-hunter-gold hover:text-hunter-ink"
            >
              Share Build
            </button>
        </div>
      </header>

      <main className="hunter-main">

        <details open className="hunter-generator mb-5 rounded-lg border border-hunter-border bg-hunter-panel">
          <summary id="generator-title" className="cursor-pointer px-5 py-4 font-semibold">Build Generator <span className="ml-2 text-xs font-normal text-hunter-muted">Choose a weapon type, rank and required skills</span></summary>
        <BuildGeneratorPanel
          weapon={selectedWeapon}
          selectedArmor={selectedArmor}
          fixedArmorSlots={fixedArmorSlots}
          onApply={(savedBuild) => {
            loadBuild(deserializeBuild(savedBuild, {
              armors: armorDefinitions,
              weapons: weaponDefinitions,
              charms: charmDefinitions,
              decorations: decorationDefinitions,
            }))
            setBuildFingerprint(null)
            setShareStatus('idle')
          }}
        />
        </details>

        <div className="hunter-primary-grid grid items-start gap-5 lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]">
          <section aria-labelledby="equipment-title" className="hunter-panel hunter-equipment min-w-0">

  <div className="mb-3">
    <h2 id="equipment-title" className="text-sm font-semibold uppercase tracking-wider text-hunter-muted">
      Equipment
    </h2>
  </div>

  <WeaponStatsPanel
              weapon={selectedWeapon}
              decorations={decorations}
              onDecorationSlotSelect={(slotIndex) => {
                setDecorationTarget({
                  type: 'weapon',
                  slotIndex,
                })

                setDecorationSelectorOpen(true)
              }}
              onSelectWeapon={() => {
                setIsWeaponSelectorOpen(true)
              }}
               onClearWeapon={() => {
                clearWeapon()
              }}
            />

  <div>
              <ArmorSlot
                slot="head"
                armor={selectedArmor.head}
                decorations={decorations}
                isFixedForGeneration={fixedArmorSlots.has('head')}
                onSelect={() => setSelectorSlot('head')}
                onClear={() => clearArmorSlot('head')}
                onToggleFixedForGeneration={() => toggleFixedArmor('head')}
                onDecorationSlotSelect={(slotIndex) => {
                    setDecorationTarget({
                      type: 'armor',
                      slot: 'head',
                      slotIndex,
                    })
                    setDecorationSelectorOpen(true)
                  }} 
              />

              <ArmorSlot
                slot="chest"
                armor={selectedArmor.chest}
                decorations={decorations}
                isFixedForGeneration={fixedArmorSlots.has('chest')}
                onSelect={() => setSelectorSlot('chest')}
                onClear={() => clearArmorSlot('chest')}
                onToggleFixedForGeneration={() => toggleFixedArmor('chest')}
                onDecorationSlotSelect={(slotIndex) => {
                  setDecorationTarget({
                    type: 'armor',
                    slot: 'chest',
                    slotIndex,
                  })

                  setDecorationSelectorOpen(true)
                }}
              />

              <ArmorSlot
                slot="arms"
                armor={selectedArmor.arms}
                decorations={decorations}
                isFixedForGeneration={fixedArmorSlots.has('arms')}
                onSelect={() => setSelectorSlot('arms')}
                onClear={() => clearArmorSlot('arms')}
                onToggleFixedForGeneration={() => toggleFixedArmor('arms')}
                onDecorationSlotSelect={(slotIndex) => {
                  setDecorationTarget({
                    type: 'armor',
                    slot: 'arms',
                    slotIndex,
                  })
                  setDecorationSelectorOpen(true)
                }}
              />

              <ArmorSlot
                slot="waist"
                armor={selectedArmor.waist}
                decorations={decorations}
                isFixedForGeneration={fixedArmorSlots.has('waist')}
                onSelect={() => setSelectorSlot('waist')}
                onClear={() => clearArmorSlot('waist')}
                onToggleFixedForGeneration={() => toggleFixedArmor('waist')}
                onDecorationSlotSelect={(slotIndex) => {
                  setDecorationTarget({
                    type: 'armor',
                    slot: 'waist',
                    slotIndex,
                  })

                  setDecorationSelectorOpen(true)
                }}
              />

              <ArmorSlot
                slot="legs"
                armor={selectedArmor.legs}
                decorations={decorations}
                isFixedForGeneration={fixedArmorSlots.has('legs')}
                onSelect={() => setSelectorSlot('legs')}
                onClear={() => clearArmorSlot('legs')}
                onToggleFixedForGeneration={() => toggleFixedArmor('legs')}
                onDecorationSlotSelect={(slotIndex) => {
                  setDecorationTarget({
                    type: 'armor',
                    slot: 'legs',
                    slotIndex,
                  })

                  setDecorationSelectorOpen(true)
                }} 
              />
              
<CharmStatsPanel
  charm={selectedCharm}
  onSelectCharm={() => {
    setIsCharmSelectorOpen(true)
  }}
  onClearCharm={() => {
    clearCharm()
  }}
/>

            </div>
          </section>

          <aside className="min-w-0 space-y-5">
            <StatsPanel
              stats={buildStats}
              weapon={selectedWeapon}
              armorPieces={armorPieces}
              decorations={decorations}
            />
            <OffensiveSimulationPanel weapon={selectedWeapon} skills={buildStats.skills} />
            
          </aside>
        </div>
        <div className="hunter-bottom-grid mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]">
          <SkillPanel skills={buildStats.skills} />
          <SetBonusPanel setBonuses={activeSetBonuses} skills={skills} />
        </div>
      </main>
      </div>

      {selectorSlot && (
        <ArmorSelector
          slot={selectorSlot}
          armors={armorDefinitions.filter(
            (armor) => armor.slot === selectorSlot,
          )}
          skills={skills}
          onSelect={handleSelectArmor}
          onClose={() => setSelectorSlot(null)}
        />
      )}
      {decorationSelectorOpen && decorationTarget && (
  <DecorationSelector
  decorations={decorationDefinitions}
  skills={skills}
  slotSize={
    decorationTarget.type === 'armor'
      ? selectedArmor[decorationTarget.slot]?.slots[
          decorationTarget.slotIndex
        ]?.size ?? 0
      : selectedWeapon?.slots[
          decorationTarget.slotIndex
        ]?.size ?? 0
    }
  hasDecoration={
    decorationTarget !== null &&
    decorations.some((equipped) => {
      if (equipped.location.type !== decorationTarget.type) {
        return false
      }

      if (
        decorationTarget.type === 'armor' &&
        equipped.location.type === 'armor'
      ) {
        return (
          equipped.location.slot === decorationTarget.slot &&
          equipped.location.slotIndex ===
            decorationTarget.slotIndex
        )
      }

      if (
        equipped.location.type === 'weapon' &&
        decorationTarget.type === 'weapon'
      ) {
        return (
          equipped.location.slotIndex ===
          decorationTarget.slotIndex
        )
      }
      return false
    })
  }
  onSelect={handleSelectDecoration}
  onRemove={() => {
    if (!decorationTarget) return

    removeDecoration(decorationTarget)
    setDecorationSelectorOpen(false)
    setDecorationTarget(null)
  }}
  onClose={() => {
    setDecorationSelectorOpen(false)
    setDecorationTarget(null)
  }}
/>
)}

{isCharmSelectorOpen && (
  <CharmSelector
    charms={charmDefinitions}
    skills={skills}
    onSelect={(charm) => {
      setCharm(charm)
      setIsCharmSelectorOpen(false)
    }}
    onClose={() => setIsCharmSelectorOpen(false)}
  />
)}

{isWeaponSelectorOpen && (
  <WeaponSelector
    weapons={weaponDefinitions}
    skills={skills}
    onSelect={(weapon) => {
      setWeapon(weapon)
      setIsWeaponSelectorOpen(false)
    }}
    onClose={() => {
      setIsWeaponSelectorOpen(false)
    }}
  />
)}

    </div>
  )
}

export default App
