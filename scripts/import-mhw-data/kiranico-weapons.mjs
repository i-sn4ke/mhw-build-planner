// Pure parsers for the public Kiranico weapon tables; no scripts are executed.
export const kiranicoWeaponTypes = [
  'great-sword', 'sword-and-shield', 'dual-blades', 'long-sword', 'hammer',
  'hunting-horn', 'lance', 'gunlance', 'switch-axe', 'charge-blade',
  'insect-glaive', 'bow', 'heavy-bowgun', 'light-bowgun',
]

export const decodeHtml = (text) => text.replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
const plain = (html) => decodeHtml(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()

// MHWorldData distinguishes upgraded Kulve weapons with a suffix which
// Kiranico omits. Rarity remains part of the identity, so HR and MR stay apart.
export const weaponIdentity = (weapon) => `${weapon.type}::${weapon.name.replace(/\s+\(MR\)$/u, '')
  .normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'")}::${weapon.rarity}`

export function parseKiranicoWeaponIndex(html, type) {
  if (!kiranicoWeaponTypes.includes(type)) throw new Error(`Unknown weapon type: ${type}`)
  const entries = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].flatMap((row) => {
    const link = row[1].match(/<a href="(https:\/\/mhworld.kiranico.com\/(?:en|it)\/weapons\/([^/]+)\/[^\"]+)">([\s\S]*?)<\/a>/)
    if (!link) return []
    const rarity = Number(plain(row[1]).match(/(?:Rarity|Rarità) (\d+)/)?.[1])
    if (!Number.isInteger(rarity) || rarity < 1 || rarity > 12) throw new Error(`Missing rarity: ${link[2]}`)
    return [{ key: link[2], type, name: plain(link[3]), rarity, url: decodeHtml(link[1]) }]
  })
  if (!entries.length) throw new Error(`Empty Kiranico index: ${type}`)
  if (new Set(entries.map((entry) => entry.key)).size !== entries.length) throw new Error(`Duplicate Kiranico keys: ${type}`)
  return entries
}

export function parseKiranicoWeaponDetail(html, entry) {
  const start = html.indexOf('<strong>Rarity ')
  if (start < 0) throw new Error(`Missing weapon statistics: ${entry.name}`)
  const stats = html.slice(html.lastIndexOf('<table', start), html.indexOf('</tbody>', start))
  const cells = [...stats.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1])
  const field = (label) => cells.find((cell) => {
    const labels = [...cell.matchAll(/<div\b[^>]*class="balance-label[^\"]*"[^>]*>([\s\S]*?)<\/div>/g)]
    return labels.some((match) => plain(match[1]) === label)
  })?.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? ''
  const numeric = (label, pattern) => {
    const match = plain(field(label)).match(pattern)
    if (!match) throw new Error(`Missing ${label}: ${entry.name}`)
    return Number(match[1])
  }
  const rarity = numeric('Rarity', /Rarity (\d+)/)
  if (rarity !== entry.rarity) throw new Error(`Rarity mismatch: ${entry.name}`)
  const elementHtml = field('Element')
  const icons = [...elementHtml.matchAll(/<img\b[^>]*element_(\d+)\.png[^>]*>/g)]
  const elements = icons.map((icon, index) => {
    const types = ['', 'Fire', 'Water', 'Ice', 'Thunder', 'Dragon', 'Poison', 'Paralysis', 'Sleep', 'Blast']
    const type = types[Number(icon[1])]
    const value = plain(elementHtml.slice(icon.index + icon[0].length, icons[index + 1]?.index ?? elementHtml.length)).match(/(\d+)/)
    if (!type || !value) throw new Error(`Invalid element: ${entry.name}`)
    return { type, damage: Number(value[1]), hidden: plain(elementHtml).includes('(') }
  })
  const weapon = {
    id: `kiranico-${entry.key}`, name: entry.name, type: entry.type, rarity,
    attack: numeric('Attack', /^(\d+)\s*\|/), affinity: numeric('Affinity', /^(-?\d+)%/),
    elements, slots: [...field('Slots').matchAll(/slot_size_(\d)\.png/g)].map((match) => ({ size: Number(match[1]) })), skills: [],
  }
  const defense = numeric('Defense Bonus', /\(([+-]?\d+)\)/)
  if (defense) weapon.defenseBonus = defense
  const shelling = plain(field('Shelling Type')).match(/^(Normal|Long|Wide) Lv (\d+)$/)
  if (shelling) { weapon.shelling = shelling[1].toLowerCase(); weapon.shellingLevel = Number(shelling[2]) }
  const phial = plain(field('Phial Type'))
  if (phial) {
    const name = phial.replace(/ Phial.*$/, '').toLowerCase()
    weapon.phial = entry.type === 'charge-blade' && name === 'power' ? 'impact' : name
    const power = phial.match(/Phial (\d+)$/)
    if (power && entry.type === 'switch-axe') weapon.phialPower = Number(power[1])
  }
  const kinsect = plain(field('Kinsect Bonus'))
  if (kinsect) {
    const bonuses = { 'Stamina Upgrade & Healing': 'stamina_health' }
    if (!bonuses[kinsect]) throw new Error(`Unmapped kinsect bonus: ${kinsect}`)
    weapon.kinsectBonus = bonuses[kinsect]
  }
  const notes = [...field('Notes').matchAll(/class="note-(\d+)"/g)]
  if (notes.length) {
    const colors = { 0: 'P', 5: 'B', 2: 'O' }
    if (notes.some((note) => !colors[note[1]])) throw new Error(`Unmapped note: ${entry.name}`)
    weapon.notes = notes.map((note) => colors[note[1]]).join('')
  }
  const upgrade = html.match(/<h6[^>]*>Upgrade [\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/)?.[1] ?? ''
  let previousKey
  for (const row of upgrade.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cell = row[1].match(/<td\b[^>]*>([\s\S]*?)<\/td>/)?.[1] ?? ''
    if (plain(cell) === entry.name) break
    const key = cell.match(/\/weapons\/([^/]+)\//)?.[1]
    if (key) previousKey = key
  }
  const materials = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].filter((row) => /(?:Forge|Upgrade) Equipment/.test(plain(row[1]))).length
  return { weapon, previousKey, materials }
}
