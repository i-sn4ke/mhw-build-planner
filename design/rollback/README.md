# UI before the guild redesign

`ui-before-guild-redesign.zip` preserves the seven source files changed by the redesign, as they were at commit `62f22bf`. It contains no generated data.

To restore the previous interface, run this from the repository root in PowerShell:

```powershell
Expand-Archive -LiteralPath design/rollback/ui-before-guild-redesign.zip -DestinationPath . -Force
npm run build
```

This overwrites only the UI files contained in the archive. Engine, store, importer and generated data are untouched. Save any subsequent changes to those UI files before restoring.

If the subsequent guild panel skin is enabled, also remove `import './equipment-skin.css'` from `src/main.tsx` to restore the original panel and title appearance.
