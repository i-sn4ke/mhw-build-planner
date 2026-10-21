import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { kiranicoWeaponTypes, parseKiranicoWeaponIndex, weaponIdentity } from './kiranico-weapons.mjs'

const read = (relative) => JSON.parse(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'))
const snapshotPath = new URL('./sources/kiranico-weapon-index.json', import.meta.url)
let snapshot = read('./sources/kiranico-weapon-index.json')
// Refresh is deliberately explicit: normal audits and tests run without network access.
if (process.argv.includes('--refresh')) {
  const entries = []
  for (const [index, type] of kiranicoWeaponTypes.entries()) {
    const pages = await Promise.all(['en', 'it'].map(async (language) => {
      const response = await fetch(`https://mhworld.kiranico.com/${language}/weapons?type=${index}`)
      if (!response.ok) throw new Error(`Kiranico HTTP ${response.status}: ${type}`)
      return parseKiranicoWeaponIndex(await response.text(), type)
    }))
    const italian = new Map(pages[1].map((entry) => [entry.key, entry]))
    for (const entry of pages[0]) {
      const translation = italian.get(entry.key)
      if (!translation) throw new Error(`Missing Italian entry: ${entry.key}`)
      entries.push({ ...entry, nameIt: translation.name, urlIt: translation.url })
    }
  }
  snapshot = { checkedAt: new Date().toISOString().slice(0, 10), entries }
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n')
}
const weapons = read('../../src/data/generated/weapons.json')
const supplemental = read('./sources/kiranico-weapons.json')
const catalog = new Set(weapons.map(weaponIdentity))
const excluded = new Set(supplemental.excluded.map(weaponIdentity))
const missing = snapshot.entries.filter((entry) => !catalog.has(weaponIdentity(entry)) && !excluded.has(weaponIdentity(entry)))
const rows = kiranicoWeaponTypes.map((type) => {
  const entries = snapshot.entries.filter((entry) => entry.type === type)
  return `| ${type} | ${entries.length} | ${new Set(entries.map(weaponIdentity)).size} | ${supplemental.weapons.filter((entry) => entry.weapon.type === type).length} |`
})
const report = `# Verifica del catalogo armi Kiranico

Data del confronto: ${snapshot.checkedAt}. Fonte: [Kiranico](https://mhworld.kiranico.com/en/weapons), indici inglesi e italiani di tutte le 14 categorie.

${snapshot.entries.length} voci negli indici; ${weapons.length} armi nel planner dopo ${supplemental.weapons.length} aggiunte. Voci senza corrispondenza e senza esclusione documentata: **${missing.length}**.

Il confronto usa categoria, nome inglese e rarità. Il suffisso locale “(MR)” viene normalizzato; le versioni Kulve HR/MR restano distinte grazie alla rarità. Le voci Safi duplicate nell'indice non vengono importate due volte. Non è una revisione delle statistiche di tutte le armi già presenti.

| Categoria | Voci Kiranico | Identità distinte | Aggiunte |
| --- | ---: | ---: | ---: |
${rows.join('\n')}

## Armi aggiunte

${supplemental.weapons.map((entry) => `- [${entry.nameIt}](${entry.sourceIt}) — ${entry.weapon.type}, rarità ${entry.weapon.rarity}.`).join('\n')}

Sono inclusi attacco, affinità, elementi e status (anche nascosti), slot, bonus difesa e metadati specifici modellati dal planner, con i collegamenti alle evoluzioni precedenti. Per Strong Ale e Master Ale, Kiranico mostra gli status doppi in unità reali: nel catalogo vengono convertiti nelle unità visualizzate (×10), come gli altri status. Il manifest contiene anche la fonte di riscontro per questa conversione.

## Voci escluse in attesa di conferma

Queste ${supplemental.excluded.length} voci non documentano materiali di forgiatura o miglioramento su Kiranico. Sembrano equipaggiamenti speciali o preimpostati: l'assenza della ricetta non dimostra da sola che siano impossibili da ottenere. Non vengono offerte come normali armi fabbricabili senza una verifica ulteriore.

${supplemental.excluded.map((entry) => `- [${entry.name}](${entry.url}) — ${entry.type}, rarità ${entry.rarity}.`).join('\n')}

## Riproduzione

- Audit offline: node scripts/import-mhw-data/audit-kiranico-weapons.mjs.
- Aggiornamento degli indici pubblici: stesso comando con --refresh (richiede rete). Le nuove assenze fanno fallire l'audit e richiedono la verifica delle relative schede.
- Dati integrativi e provenienza: scripts/import-mhw-data/sources/kiranico-weapons.json.
- Rigenerazione: node scripts/import-mhw-data/import-weapons.mjs, poi node scripts/import-mhw-data/import-localization.mjs.
`
fs.mkdirSync(new URL('../../docs/', import.meta.url), { recursive: true })
fs.writeFileSync(new URL('../../docs/kiranico-weapon-audit.md', import.meta.url), report)
console.log(`${snapshot.entries.length} Kiranico entries; ${weapons.length} catalog weapons; ${missing.length} unexplained missing entries.`)
console.log(fileURLToPath(new URL('../../docs/kiranico-weapon-audit.md', import.meta.url)))
if (missing.length) {
  console.error(missing.map((entry) => `${entry.type}: ${entry.name} (${entry.rarity}) — ${entry.url}`).join('\n'))
  process.exitCode = 1
}
