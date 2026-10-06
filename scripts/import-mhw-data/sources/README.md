# Damage simulation sources

The initial scope is five ordinary, single-hit Long Sword attacks and normal,
unbroken parts of Great Jagras, Rathian and Rathalos. No hand-edited generated JSON.

`long-sword-attacks.csv` contains numeric facts extracted on 2026-10-05 from
MoonBunnie & Deathcream's [MHWI Weapon Attack Tables](https://bit.ly/MHWIWeaponAttackTables),
Long Sword tab (`gid=362236353`). Step Slash, Overhead Slash, Thrust, Rising Slash
and Fade Slash all use sever damage and an element modifier of 1.

The [MHWI General Data Sheet](https://bit.ly/MHWIGeneralDataSheet), Weapon Multipliers
(`gid=634609634`), Long Sword (`gid=82408715`) and Formulas (`gid=420619997`) tabs
provide sharpness, crit, Spirit, sweetspot and softening values. The
[MHWI Damage Formula](https://bit.ly/MHWIDamageFormula) Full Damage Formula,
Sources: Attack, Sources: Element Dmg and Sources: Damage tabs provide calculation
order, caps, rounding and enrage modifiers. White elemental sharpness uses
Iceborne's **1.15**, and purple uses **1.25**.

Monster hitzones are imported from the existing local
`../MHWorldData/source_data/monsters/monster_hitzones.csv`, with ordinary parts
cross-checked against the current Kiranico physiology tables:

- [Great Jagras](https://mhworld.kiranico.com/en/monsters/zJ1Sb/great-jagras)
- [Rathian](https://mhworld.kiranico.com/en/monsters/Rz9Tb/rathian)
- [Rathalos](https://mhworld.kiranico.com/en/monsters/BnetX/rathalos)

All three use the default softening offset (0) and enrage received-damage modifier
1.10. State variants (broken parts, inflated stomach) are intentionally excluded.
Quest received-damage multiplier is assumed to be 1.00. Deterministic half-up
rounding can differ from the game's floating-point boundary behavior by one.

Regenerate from the local inputs:

```sh
node scripts/import-mhw-data/import-damage-simulation.mjs
```

The application bundles these data locally and does not fetch spreadsheet or
monster data at runtime. Existing equipment catalogs are unaffected.
