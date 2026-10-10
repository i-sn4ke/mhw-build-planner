# Planner fonts

Fonts are served locally; there are no runtime Google Fonts requests.

- Cinzel Decorative, bold 700: Build Planner title.
- IM Fell English SC, regular 400: section headings.
- Cinzel, regular 400 / semibold 600 / bold 700: equipment names, values, controls and descriptions.
- Guild Carved Display: previous custom uppercase title font, retained for rollback. Derived from the bundled Cinzel Bold under the same SIL Open Font License (see `Cinzel-OFL.txt`); the family is renamed. The user-provided logo guides heavier strokes, irregular edges and a narrow O counter. This is an interpretation, not the official Monster Hunter font.

Guild Carved Display contains A–Z, 0–9, spaces and `. , : ; ! ? ' - + / ( ) & %`. Lowercase input maps to the capital glyphs. Rebuild with `scripts/create-guild-display-font.py` using Python and fonttools 4.66.1; the tooling is not an npm or app runtime dependency. The script optionally accepts the path to a temporary fonttools installation. Original font files remain untouched. Parchment texture is applied by CSS, not baked into glyphs.

Downloaded from the Google Fonts stylesheet:
https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=IM+Fell+English+SC&display=swap

Both families' SIL Open Font License files are included alongside the TTF files. Sources: https://github.com/google/fonts/tree/main/ofl/cinzel and https://github.com/google/fonts/tree/main/ofl/imfellenglishsc.

Cinzel Decorative Bold comes from https://github.com/google/fonts/tree/main/ofl/cinzeldecorative. Its license is included in `Cinzel-Decorative-OFL.txt`.
