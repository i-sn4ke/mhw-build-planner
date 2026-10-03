import type { ArmorSlot, WeaponType } from '../types/armor'

const icons = import.meta.glob<string>('../assets/hunter/icons/*.svg', {
  query: '?raw', import: 'default', eager: true,
})

// MHW / Iceborne rarity colors. Higher MR tiers use a static halo here.
// Reference: https://wikiwiki.jp/nenaiko/システム/レア度
const rarityColors = ['#b5b5af', '#b5b5af', '#eeeae0', '#dec74c', '#82bd69', '#7bc9d7', '#7896e9', '#ab7bda', '#e79a55', '#e96666', '#67b6df', '#edcb76', '#e4eef3']
const armorIconNames: Record<ArmorSlot, string> = { head: 'head', chest: 'chest', arms: 'arm', waist: 'waist', legs: 'leg' }
const weaponIconNames: Record<WeaponType, string> = {
  'great-sword': 'greatsword', 'long-sword': 'longsword', 'sword-and-shield': 'sword_and_shield',
  'dual-blades': 'dual_blades', hammer: 'hammer', 'hunting-horn': 'hunting_horn', lance: 'lance', gunlance: 'gunlance',
  'switch-axe': 'switch_axe', 'charge-blade': 'charge_blade', 'insect-glaive': 'insect_glaive',
  'light-bowgun': 'light_bowgun', 'heavy-bowgun': 'heavy_bowgun', bow: 'bow',
}

function EquipmentIcon({ category, rarity }: { category: ArmorSlot | WeaponType | 'charm'; rarity?: number }) {
  const name = category in armorIconNames ? armorIconNames[category as ArmorSlot]
    : category === 'charm' ? 'charm' : weaponIconNames[category as WeaponType]
  const source = icons[`../assets/hunter/icons/ic_equipment_${name}_base.svg`]
  return <span className={`hunter-equipment-icon ${rarity === undefined ? 'hunter-icon-empty' : ''} ${rarity !== undefined && rarity >= 10 ? 'hunter-icon-master' : ''}`}
    style={{ color: rarityColors[rarity ?? 0] ?? rarityColors[0] }} aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: source ?? '' }} />
}

export default EquipmentIcon

export function HunterStatIcon({ name }: { name: 'attack' | 'affinity' | 'defense' }) {
  return <span className="hunter-stat-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: icons[`../assets/hunter/icons/ic_ui_${name}.svg`] ?? '' }} />
}

export function HunterElementIcon({ name }: { name: 'fire' | 'water' | 'thunder' | 'ice' | 'dragon' }) {
  return <span className={`hunter-stat-icon hunter-element-${name}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: icons[`../assets/hunter/icons/ic_element_${name}.svg`] ?? '' }} />
}
