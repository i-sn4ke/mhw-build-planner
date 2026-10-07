# Localization

`messages-it.json` contains interface translations. English is the fallback language.
`generated/it.json` contains MHWorldData names and skill descriptions, keyed by the
existing catalog IDs. Regenerate it with:

```sh
node scripts/import-mhw-data/import-localization.mjs
```

The importer reads `../MHWorldData/source_data/` and the planner's existing
catalogs. It does not rewrite equipment data or identifiers. Missing Italian
entries are omitted so the English text stays visible.

`overrides-it.json` holds manually confirmed names, keyed by the same catalog
IDs. These take precedence over imported names and survive regeneration.

`kiranico-it.json` fills gaps with names and skill descriptions verified against
Kiranico's English and Italian pages. Source URLs are recorded in
`docs/kiranico-italian-translations.json`. It is separate from MHWorldData's
generated dictionary. User-confirmed overrides take precedence over both sources.

The catalog includes skill names, general descriptions and level effects,
equipment, set bonuses and the simulator's three monsters. Part names, basic
attack labels and other interface terms are translated in `messages-it.json`;
these are interface translations, not imported game text.

`useTranslation` updates React text and accessibility labels without changing
equipment objects. Search aliases include both English and Italian, independently
of the displayed language. Language preference is stored locally; shared build
URLs keep their existing format and do not include the language preference.
