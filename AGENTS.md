# Versjonering av appen

- `package.json` → `version` er eneste kilde til appens versjonsnummer. Ikke hardkod versjonen i brukergrensesnittet eller GitHub-workflowene.
- Oppdater versjonen når en ny apputgivelse klargjøres for innfletting i `main`: patch for feilrettinger, minor for nye funksjoner og major for inkompatible endringer. Behold samme versjon gjennom arbeidet med én planlagt utgivelse.
- Lokal produksjonsbygging og GitHub Pages skal bruke samme byggkommando (`pnpm build`). Appen skal vise `__APP_VERSION__`, som Vite leser fra `package.json`.
- Kjør `pnpm build` etter versjonsendringer. Bygget kontrollerer at `dist/version.json` og den bygde appen bruker versjonen i `package.json`.
- Etter publisering: kontroller `version.json` på GitHub Pages og appens synlige versjon. Ikke påstå at Pages er oppdatert før dette er verifisert. En eldre åpen app må bruke oppdateringsknappen for å laste det nye bygget.
