# Monster Hunter: World + Iceborne Build Planner

Plan a build, check your skills, and find equipment that fits the way you want to play.

This is a browser-based build planner for **Monster Hunter: World and Iceborne**, with a Monster Hunter-inspired interface and a full local equipment catalog. No account or backend is needed.

**[Try the planner](https://i-sn4ke.github.io/mhw-build-planner/)**

## Build your own setup

Choose a weapon, five armor pieces, a charm, and decorations. Click an equipment icon to open its selector, then search by equipment name or by the skills it provides. Filters cover weapon type, armor rank, rarity, elements, status effects, and decoration slot size, depending on what you are selecting.

Skill tooltips show what each skill does at the relevant level. The planner keeps your equipment, base stats, active skills, set bonuses, and decoration slots together, including Secret skill caps and Inheritance.

## Generate builds

Pick an armor rank and the minimum skill levels you want. The generator looks for up to three armor, charm, and decoration combinations that meet those requirements, preferring different armor set layouts over small alpha/beta variations. You can compare changed pieces, extra skills, and unused slots before applying a result.

Already have a few pieces in mind? Mark them with **Keep for generated builds** and the generator will fill the remaining armor slots. Fixed pieces must match the selected rank.

Generated builds meet your skill requirements without relying on a weapon's skills, slots, or set bonuses. Applying a result keeps your equipped weapon, so you can change weapons later without losing the skills supplied by the generated setup. The weapon type selector in the generator only presets the manual weapon filter.

A few things to keep in mind:

- Rank filters armor; charms and decorations come from the full catalog.
- Decorations are treated as available in unlimited copies.
- Results satisfy skill requirements and are not ranked by damage.
- The search runs in a background worker and has limits. If it stops without results, that does not necessarily mean no valid build exists.

## Check attack and affinity

The **Attack / Affinity** panel shows how supported skills affect your equipped weapon. You can toggle conditions such as monster rage, weak spots, wounds, health, and stamina requirements to see their contributions.

Supported skills include Attack Boost, Critical Eye, Agitator, Weakness Exploit, Peak Performance, Resentment, Maximum Might, Latent Power, and Critical Draw.

Base stats remain separate from this simulation: they describe the equipment without skill effects, upgrades, or augments.

## Try the damage simulator

The **Damage Simulator** has its own tab and uses your current build. This first version supports **Long Sword**, five basic attacks, and the ordinary parts of **Great Jagras, Rathian, and Rathalos**.

Choose a monster, body part, sharpness, and Spirit level to compare normal, critical (or feeble), and average hit damage. Physical and elemental damage are shown separately. Weakness Exploit follows the selected part automatically; manual conditions are shared with Attack / Affinity. Switching tabs preserves your build and simulation selections.

The calculation also supports Critical Boost, elemental attack skills, Free Elem, Non-elemental Boost, and Critical Element / True Critical Element. Average damage accounts for affinity; it is not DPS.

This is a limited single-hit simulator. It assumes unbroken parts and a quest damage multiplier of 1. It does not cover combos, Helmbreaker or Iai attacks, status procs, augments, custom upgrades, awakened abilities, items, food, mantles, or every skill effect. Sharpness is selected manually rather than checked against the weapon. The panel includes calculation details and limitations, and the [data sources](scripts/import-mhw-data/sources/README.md) document where the values come from.

## Share a build

Click **Share Build** to copy a link containing your weapon, armor, charm, and decorations. Anyone opening it gets the same setup in the editor.

Builds are encoded in the URL's `?b=<payload>` parameter. Simulation choices and generator constraints stay local and are not included in shared links.

## Run locally

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Other commands:

```sh
npm run build    # Check TypeScript and build into dist/
npm run preview  # Preview the production build
npm run lint     # Check code style and common errors
npm test         # Run calculation and generator tests
```

For the production preview, open `/mhw-build-planner/` at the address printed by Vite. Development uses `/`; production uses `/mhw-build-planner/`. GitHub Actions deploys to GitHub Pages after pushes to `main`.

## About the project

Built with **React, TypeScript, Vite, Tailwind CSS, and Zustand**. Equipment data, fonts, icons, and artwork are bundled locally. Calculations and build generation run in the browser without catalog API requests.

The main code lives in:

- `src/components/` — interface components
- `src/engine/` — build calculations, generation, simulation, and sharing
- `src/store/` — equipped build state
- `src/workers/` — background build search
- `src/data/generated/` — imported game catalogs

Generated JSON files should be updated through the importers in `scripts/import-mhw-data/`, not edited by hand or replaced with mock data. The importers use the local `../MHWorldData/source_data/` directory; you do not need it just to run or build the app.

## Credits

This is an unofficial fan project. **Monster Hunter belongs to Capcom.**

Asset sources and licenses are documented in [the artwork credits](src/assets/hunter/README.md) and [the current theme credits](src/assets/hunter/ui-v3/README.md). Icons from MHWorldData include their MIT license. Licenses for IM Fell English SC, Cinzel, and Guild Carved Display are included in [the fonts directory](src/assets/fonts/).
