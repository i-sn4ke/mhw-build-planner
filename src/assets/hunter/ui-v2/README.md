# Mockup-derived UI assets v2

Generated with the built-in image_gen tool using the approved mockup `exec-d7f65ea1-8732-48e0-b5b7-6ebb16800b5d.png` as the image reference. These are new artwork derived from its style, not pixel-identical crops of the source.

| File | Use | Size | CSS slice |
| --- | --- | --- | --- |
| board-frame-v2.png | Weathered wood rails and iron corner plates | 1254 × 1254 | 115 |
| menu-frame-v2.png | Bronze rim and square rivets for rows, panels and icon wells | 1254 × 1254 | 115 |
| button-surface-v2.png | Bronze blank button with dark textured center | 1254 × 1254 | 155, fill |
| tribal-divider-v2.png | Distressed sepia decorative band | 2172 × 724 | background centered vertically |
| guild-watermark-v2.png | Ochre tribal crest behind set bonus data | 1254 × 1254 | contain, low opacity |
| header-flourish-v1.png | Thin engraved copper rule with side motifs for the header | 2172 × 413 | header overlay, centered |

All PNGs preserve the generated RGBA alpha. The two hollow frames have transparent centers; the button center has opaque-looking dark texture. No text is baked into the images.

`components.css` contains isolated classes ready for later integration. Nine-slice CSS preserves the corner geometry and stretches the rails. Border thickness is controlled independently of source dimensions. The strip's transparent vertical padding is handled by a centered CSS background.

Visual sample: `../../../../design/hunter-assets-v2.html`. Sample content uses existing equipment names; the preview is a static design specimen and does not provide build logic. The assets are now integrated in the React interface through `src/hunter-assets.css`, imported after the layout stylesheet.

The complete original v2 generation prompts, including the button cleanup edit, are in `prompts.json`. The new header flourish preserves its generated RGBA artwork; only transparent padding around the visible pixels was trimmed for a better fit.
