import type { CalculatedBuildStats } from '../engine/buildCalculator'
import type { ArmorPiece, Weapon } from '../types/armor'
import type { EquippedDecoration } from '../types/equipment'
import WeaponDetails from './WeaponDetails'
import OffensiveSimulationPanel from './OffensiveSimulationPanel'

interface StatsPanelProps {
  stats: CalculatedBuildStats
  weapon: Weapon | null
  armorPieces: ArmorPiece[]
  decorations: EquippedDecoration[]
}

const resistanceNames = {
  fire: 'Fire', water: 'Water', thunder: 'Thunder', ice: 'Ice', dragon: 'Dragon',
}

function StatsPanel({ stats, weapon, armorPieces, decorations }: StatsPanelProps) {
  const equipmentSlots = [
    ...(weapon?.slots.map((slot, slotIndex) => ({
      size: slot.size,
      used: decorations.some((entry) => entry.location.type === 'weapon' && entry.location.slotIndex === slotIndex),
    })) ?? []),
    ...armorPieces.flatMap((armor) => armor.slots.map((slot, slotIndex) => ({
      size: slot.size,
      used: decorations.some((entry) => entry.location.type === 'armor' && entry.location.slot === armor.slot && entry.location.slotIndex === slotIndex),
    }))),
  ]

  return (
    <section className="rounded-lg border border-[#30343a] bg-[#191b1f] p-5" aria-labelledby="stats-title">
      <h2 id="stats-title" className="text-sm font-semibold uppercase tracking-wider text-[#9b9b95]">Base Stats</h2>
      <p className="mt-2 text-xs text-[#777b82]">
        Base equipment values. Skill effects, upgrades and augments are not applied.
      </p>

      <dl className="mt-4 space-y-3 border-b border-[#30343a] pb-4">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-[#9b9b95]">Attack</dt>
          <dd className="text-lg font-semibold">{weapon ? stats.attack : '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-[#9b9b95]">Affinity</dt>
          <dd className={`text-lg font-semibold ${stats.affinity < 0 ? 'text-[#d87878]' : stats.affinity > 0 ? 'text-[#8fcf7a]' : ''}`}>
            {weapon ? `${stats.affinity > 0 ? '+' : ''}${stats.affinity}%` : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-[#9b9b95]">Defense</dt>
          <dd className="text-lg font-semibold">{stats.defense}</dd>
        </div>
        <div className="flex items-center justify-between text-xs text-[#777b82]">
          <dt>Armor base</dt><dd>{stats.armorDefense}</dd>
        </div>
        <div className="flex items-center justify-between text-xs text-[#777b82]">
          <dt>Weapon bonus</dt><dd>{stats.weaponDefenseBonus > 0 ? '+' : ''}{stats.weaponDefenseBonus}</dd>
        </div>
      </dl>

      <OffensiveSimulationPanel weapon={weapon} skills={stats.skills} />

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#666a70]">Resistances</h3>
        <dl className="space-y-2">
          {Object.entries(stats.resistances).map(([element, value]) => (
            <div key={element} className="flex items-center justify-between gap-3">
              <dt className="text-sm text-[#9b9b95]">{resistanceNames[element as keyof typeof resistanceNames]}</dt>
              <dd className={value > 0 ? 'text-sm text-[#8fcf7a]' : value < 0 ? 'text-sm text-[#d87878]' : 'text-sm text-[#9b9b95]'}>
                {value > 0 ? `+${value}` : value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 border-t border-[#30343a] pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#666a70]">Weapon Details</h3>
        {weapon ? (
          <>
            <WeaponDetails weapon={weapon} />
            {!weapon.elements.length && <p className="mt-2 text-sm text-[#9b9b95]">Element / Status: None</p>}
          </>
        ) : <p className="text-sm text-[#777b82]">No weapon selected.</p>}
      </div>

      <div className="mt-4 border-t border-[#30343a] pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#666a70]">Decoration Slots</h3>
        <p className="mb-2 text-xs text-[#777b82]">{equipmentSlots.filter((slot) => slot.used).length} / {equipmentSlots.length} used</p>
        <dl className="space-y-2">
          {[4, 3, 2, 1].map((size) => {
            const slots = equipmentSlots.filter((slot) => slot.size === size)
            if (!slots.length) return null
            return (
              <div key={size} className="flex items-center justify-between text-sm">
                <dt className="text-[#9b9b95]">Size {size}</dt>
                <dd>{slots.filter((slot) => slot.used).length} / {slots.length} used</dd>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}

export default StatsPanel
