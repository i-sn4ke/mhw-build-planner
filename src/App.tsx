import type { Decoration } from './types/decoration'

import { useState } from 'react'
import { useBuildStore } from './store/buildStore'

import ArmorSelector from './components/ArmorSelector'
import ArmorSlot from './components/ArmorSlot'
import SkillPanel from './components/SkillPanel'
import StatsPanel from './components/StatsPanel'
import CharmStatsPanel from './components/CharmStatsPanel'
import DecorationSelector from './components/DecorationSelector'
import WeaponStatsPanel from './components/WeaponStatsPanel'
import SetBonusPanel from './components/SetBonusPanel'
import CharmSelector from './components/CharmSelector'
import WeaponSelector from './components/WeaponSelector'

import {calculateBuildStats,} from './engine/buildCalculator'

import { armors as armorDefinitions } from './data/armor'
import { weapons as weaponDefinitions } from './data/weapons'
import { decorations as decorationDefinitions } from './data/decorations'
import { skills } from './data/skills'
import { setBonuses as setBonusDefinitions } from './data/setBonuses'
import { charms as charmDefinitions } from './data/charms'

import { calculateSetBonuses } from './engine/setBonuses'


import type {
  ArmorPiece,
  ArmorSlot as ArmorSlotType
} from './types/armor'

function App() {
  const selectedArmor = useBuildStore(
    (state) => state.selectedArmor,
  )

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

  const addDecoration = useBuildStore(
    (state) => state.addDecoration,
  )

  const clearWeapon = useBuildStore(
    (state) => state.clearWeapon,
  )

  const removeDecoration = useBuildStore(
  (state) => state.removeDecoration,
)

  const handleSelectArmor = (armor: ArmorPiece) => {
    setArmor(armor)

    setSelectorSlot(null)
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
)

  return (
    <div className="min-h-screen bg-[#111214] text-[#e7e4da]">
      <header className="border-b border-[#30343a] px-8 py-5">
        <h1 className="text-xl font-bold tracking-wide">
          MONSTER HUNTER: WORLD
        </h1>

        <p className="mt-1 text-sm text-[#9b9b95]">
          Build Planner
        </p>
      </header>

      <main className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">
            Build Editor
          </h2>

          <p className="mt-2 text-[#9b9b95]">
            Create your armor set.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>

  <div className="mb-3">
    <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9b9b95]">
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

  <div className="grid gap-4 md:grid-cols-2">
              <ArmorSlot
                slot="head"
                armor={selectedArmor.head}
                decorations={decorations}
                onSelect={() => setSelectorSlot('head')}
                onClear={() => clearArmor('head')}
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
                onSelect={() => setSelectorSlot('chest')}
                onClear={() => clearArmor('chest')}
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
                onSelect={() => setSelectorSlot('arms')}
                onClear={() => clearArmor('arms')}
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
                onSelect={() => setSelectorSlot('waist')}
                onClear={() => clearArmor('waist')}
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
                onSelect={() => setSelectorSlot('legs')}
                onClear={() => clearArmor('legs')}
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

          <aside className="space-y-4">

            <SkillPanel skills={buildStats.skills} />

            <SetBonusPanel
              setBonuses={activeSetBonuses}
              skills={skills}
            />

            <StatsPanel
              defense={buildStats.defense}
              resistances={buildStats.resistances}
            />
            
          </aside>
        </div>
      </main>

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
    onSelect={(weapon) => {
      setWeapon(weapon)
      setIsWeaponSelectorOpen(false)
    }}
    onClose={() => {
      setIsWeaponSelectorOpen(false)
    }}
  />
)}

<div className="mt-4 rounded-lg border border-[#30343a] bg-[#191b1f] p-4">
  <div className="mb-3">
    <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9b9b95]">
      Equipped Decorations
    </h2>
  </div>

  {decorations.length === 0 ? (
    <p className="text-sm text-[#666a70]">
      No decorations equipped.
    </p>
  ) : (
    <div className="space-y-2">
{decorations.map((equipped) => (
  <div className="flex items-center justify-between rounded-md bg-[#15171a] px-3 py-2">
    <div>
      <p className="text-sm font-medium text-[#e7e4da]">
        {equipped.decoration.name}
      </p>

      <p className="mt-1 text-xs text-[#666a70]">
        {equipped.location.type === 'armor'
          ? `${equipped.location.slot} slot ${equipped.location.slotIndex + 1}`
          : `Weapon slot ${equipped.location.slotIndex + 1}`}
      </p>
    </div>

    <span className="text-xs text-[#c99a45]">
      Size {equipped.decoration.slotSize}
    </span>
  </div>
))}
    </div>
  )}
</div>
    </div>
  )
}

export default App