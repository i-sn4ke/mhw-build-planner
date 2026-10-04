# Guild panel materials

`equipment-frame-v2.png` is an RGBA hollow frame derived from the user-provided Monster Hunter UI reference. Generated with the built-in image_gen tool, then refined with an edit to remove the wide outside padding. The transparent center lets real React controls render underneath; no labels or equipment are baked into the image.

`equipment-frame-v3.png` is the approved simpler variant, now used by the panel. Its compact engraved corner caps replace the elaborate dragon ornaments. The previous v2 is retained for comparison or restoration. Only the CSS image reference changed; materials, layout and controls remain identical.

Simplification prompt (built-in image_gen): Edit only the four corner ornaments of v2 into compact hammered bronze L-shaped caps, each with one angular guild engraving and a small dark rivet. Reduce ornament complexity by about 60 percent. Preserve the frame dimensions, dark iron rails, warm brass highlights, weathering and transparency. No text, controls or panel background.

The approved Equipment skin is shared by the main `.hunter-panel` panels in `src/equipment-skin.css`. CSS nine-slice (320 source pixels, 36 CSS pixels) preserves corner detail while stretching the rails. Existing parchment and ornament assets supply surface texture and the fading heading divider. The generator uses the same materials, and the title has an engraved gold finish. The Monster Hunter logo is unchanged. No engine, data, layout grid or event handler changes are required.

To disable this study, remove `import './equipment-skin.css'` from `src/main.tsx`.

## Bestiary header and actions

`dark-parchment-v1.png` is a standalone, text-free matte charcoal-brown paper texture derived with image_gen from the approved panel-material mockup. Shared CSS applies it to the Equipment, Stats, Simulation, Skills, Set Bonuses and Generator surfaces. Darker overlays make item and skill rows quieter than their panel bases. The header artwork, frames, dimensions and interactions are unchanged.

`bestiary-header-zinogre-v2.png` is the active full-bleed charcoal ink background derived with the built-in image_gen tool from the approved bestiary header mockup. Rathalos remains on the left; Zinogre replaces Diablos on the right. The second edit simplifies Zinogre's mane and scales into open copper contour lines and light hatching to match Rathalos, removing blue accents. There are no baked-in texts, logos or buttons. The more detailed v1 is retained for comparison. CSS crops the background responsively while keeping the existing HTML logo, custom title and controls.

`bestiary-button-rim.svg` is a scalable, hand-authored interpretation of the approved etched copper button edges, with restrained angular corner strokes. CSS supplies separate red leather and charcoal inset materials, hover and pressed states. Layout and handlers remain unchanged.

`bestiary-header-zinogre-v3.png` supersedes v2 as the active background: the beasts are recomposed around a quiet central title area; Zinogre howls with restrained azure ink accents and branching lightning sketches. The header now uses equal side columns to center the title, a smaller subtitle and compact buttons whose border-image widths match their actual borders. On mobile, artwork sits between the top logo/actions and centered title below. Earlier backgrounds remain available for visual rollback; other panels and app behavior are unchanged.

`bestiary-header-zinogre-azure-v5.png` is the current approved background. It is a color-only reinterpretation of the supplied v3 base, with light azure Zinogre linework and ivory lightning while retaining the sparse sketch composition. Desktop background positioning favors the upper artwork (35%) so the raised muzzle stays clear of the top frame at full-width viewport sizes. The more detailed azure v4 is an unused study.

## Generation prompts (built-in tool)

`tribal-title-divider-v1.png` is the transparent, symmetrical divider derived with image_gen from the approved World + Iceborne concept. CSS centers it beneath the live subtitle, tints it to the same light bronze as panel glyphs and fades both ends. Desktop size is 200 × 20px; mobile uses 180 × 16px. The old quest ornament remains available for rollback.

`tribal-heading-glyphs-v1.png` is a transparent five-row sprite derived with image_gen from the approved light-bronze heading concept. Rows contain a sword, heart, claw marks, rune and overlapping scales with stepped tribal trails. CSS masks select each panel's row, tint the ink to `#b08963` and fade it toward the right. A shared 8px heading gap keeps the lettering clear; the art is decorative and has no interaction. Earlier heading ornaments remain available in ui-v2.

Initial: Create an isolated hollow panel frame matching the Equipment panel of the provided mockup: thin dark iron rails, weathered copper and bronze, compact engraved dragon-vine corners, dull brass highlights. Straight-on; transparent center and outside; no text, icons, equipment, background or perspective. Keep rail centers stretchable for CSS nine-slice.

Final refinement prompt, verbatim:

> Use case: precise-object-edit. Edit target: the supplied isolated bronze/iron hollow panel frame. Keep the carved dragon corner artwork and black iron narrow rails, matching this artwork exactly. Change only the canvas framing and transparency: remove the huge transparent margin at LEFT and RIGHT, crop the canvas tightly around the four outer corners, so outer corner artwork reaches within 2 pixels of EACH canvas edge. Remove ALL brown haze / glow / tinted material behind the frame. Center interior and entire outside must be truly transparent with alpha zero. No fill, no background, no drop shadow, no glow. Need a clean hollow BORDER asset for CSS nine-slice, with compact fixed ornate corner regions and thin straight rail centers. No text, no layout, no additional panels. Deliver only the tightly cropped hollow panel frame, preserving the same fine carved artwork.

The initial unused variant remains in the image-generation output directory; only the refined asset is included in the project.
