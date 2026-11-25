# Håndballtrener’n

Ny utviklingsrunde: [3.2.0 – fra plan til praksis](RAPPORT-3.2.0.md). Rapporten beskriver levert funksjonalitet, tester og gjenstående detaljkrav. Endringene klargjøres lokalt; publisering gjøres av eieren.

Norsk React/TypeScript/Vite-app for håndballtrening, flere lag, SVG-øvelsesbank og offlinebruk. Appversjonen kommer kun fra package.json. Konto og ekstern KI er ikke nødvendig. Valgfri privat synkronisering er beskrevet i [SYNC.md](SYNC.md).

Mobilrettinger og offentlig spillerimport er beskrevet i [rapporten for 3.0.1](RAPPORT-3.0.1.md). Se [norsk veiledning for spillerimport](SPILLERIMPORT.md) før du legger inn navn i `public/rosters.json`. Filen inneholder godkjente navn og nivåer for Vålerenga G2016/17; eksempler ligger separat i `docs/rosters.example.json`.

## Kjøring og tester

Node.js 24 og pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm dev
```

Produksjonsbygging kontrollerer TypeScript og samsvar mellom package.json, appkode og dist/version.json. Samme kommando brukes lokalt og på GitHub Pages.

```sh
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:mobile
node scripts/diagram-report.mjs
```

Nettlesertestene starter en isolert server under /handball/ og bruker syntetiske spillere. De åpner aldri den vanlige appens brukerdata. EDGE_PATH kan peke til Edge. SCREENSHOT_DIR lagrer skjermbilder ved 360, 390, 768 og 1280 px samt oversikter over alle 122 illustrasjoner. V3_ONLY, AUDIT_ONLY og SYNC_ONLY avgrenser feilsøking; full godkjenning bruker ingen av disse.

Mobiltesten kontrollerer 320, 360, 390, 412, 768 og 1280 px, mørk visning, 200 % tekst og simulert tvungen mørk visning. Den sjekker elementoverlapp og faktisk visningsbredde og lagrer bilder i `qa/3.0.1/` (git-ignorert). Nettlesertesten tester også automatisk spillerimport, offlinebruk og PWA-oppdatering med nye JS- og CSS-adresser. `ROSTER_ONLY=1` avgrenser nettlesertesten til import; `MOBILE_MODE=large` avgrenser mobiltesten ved feilsøking.

## Arbeidsflyten i 3.2

Åpne dagens trening fra forsiden, registrer oppmøte, organiser og godkjenn lag, og start timeren i treningsvisningen. Plan B endrer oppsettet uten å fjerne originalplanen. Avslutt med valgfri evaluering. Pågående treninger og flere utkast lagres per lag og følger sikkerhetskopien.

I planleggeren kan du låse øvelser, fylle ledig tid og se tidslinje med overganger. Under Mitt lag kan du legge inn faste treningsdager og opprette utkast fra sesongplanen. Øvelsesbanken har kompakt visning og flervalg; illustrasjoner har avspilling, speiling og PNG-eksport.

De nye regresjonstestene ligger i `tests/workflow320.test.mjs` og `tests/browser-workflow320.mjs` og kjøres av de vanlige testkommandoene. `WORKFLOW_ONLY=1` avgrenser `node tests/browser.mjs` ved feilsøking.

## Nytt i 3.0-utgivelsen

- Aktivt lag står synlig øverst. Opprett, bytt, gi nytt navn, arkiver og gjenaktiver lag under Mitt lag. Hvert lag har egen spillerstall, nivåer, utkast, treninger, maler, regler, sesongplan og standardinnstillinger.
- Oppmøte skiller mellom ikke registrert og null fremmøtte. Arkiverte spillere bevares i historikken, men velges ikke automatisk ved import. Kopier nullstiller oppmøte, evaluering og gjennomført-status.
- Lagdeling støtter sammen, fra hverandre og låst lagnummer. Motstridende regler forklares. Manuelle regelbrudd må rettes før lagring. Uten regler brukes den etablerte balanseringsalgoritmen.
- Konkrete variantvalg følger øvelsen til hallmodus og eksport. Sammenhengende progresjoner beholdes samlet. Egne diagramtrinn kan knyttes til en variant.
- Forslag prioriterer enkle oppsett, aktivitet og lite kø ved én trener. Metadata skiller dokumenterte, redaksjonelt vurderte og ukjente egenskaper. Favoritter og godt vurderte økter gir valgfri lokal prioritering.
- Plan B har oppmøteendring, kildebasert nivåtilpasning, alternativer, kø, tid og femminuttersbank. Originalplanen lagres ved første endring og kan gjenopprettes etter omlasting.
- «5 minutter til overs» har de ni bestilte øvelsene. Samlingen kan endres uten å slette originaløvelser. Hurtigknapp finnes i bank, hallmodus og Plan B.
- Del kort eller detaljert ren tekst: forhåndsvisning, kopiering, nettleserens delingsmeny og .txt. Spillerlister og individuelle nivåer utelates. Kontroller egne kommentarer før deling.
- Ukeplan: tema, antall uker, treninger per uke og progresjon. Opprett redigerbare økter fra ukene. Historikk skiller gjennomført fra planlagt og er ikke en måling av spillerutvikling.

## Data og migrering

handballtrenern.v3 inneholder alle lag og felles øvelsesdata i én validert skriving. Gamle nøkler handballtrenern.v1 og handballtrenern.draft.v1 leses ved første migrering og beholdes uendret som reserve. Gammel spillerstall og historikk knyttes samlet til første lag. Uleselige data overskrives ikke. Migreringsmeldingen tilbyr eksport; redningskopien inkluderer rå lagring og påbegynte endringer.

Utkast lagres etter 450 ms og ved skjuling/lukking. Lagbytte sikrer siste utkast. Web Locks og sammenligning av lagrede snapshots hindrer at faner overskriver hverandre. Andre redigeringsfaner åpnes skrivebeskyttet.

Backup under Mitt lag inkluderer alle lag, sesongplaner, økter, utkast, Plan B-originaler, regler, hurtigsamling, favoritter, notater, egne øvelser, diagrammer, trinn og status. Gamle 2.1-kopier kan importeres. Import validerer før bekreftet erstatning. Innloggingstoken inngår ikke i backup. Brukerdata skal overføres privat, aldri via offentlig repository.

## Kilde og illustrasjoner

Master v3 har 205 unike oppføringer: 122 hovedøvelser, fire tilleggsbanker og 11 uavklarte oppføringer. Originaltekst og etablerte ID-er er uendret. [DIAGRAMSTATUS.md](DIAGRAMSTATUS.md) viser status for samtlige 122 hovedøvelser.

#/illustrasjoner viser alle hovedøvelser og trinn. Editor støtter fullskjerm, berøring, presise koordinater, nummerering, duplisering, buer, knekkpunkter, utstyrssymboler, flere trinn og angre/gjør om. Egne overstyringer har forrang og inngår i backup/synkronisering. Skisser er ikke målfaste eller uavhengig trenerfaglig godkjent.

Kildeleste oppsett ligger i scripts/diagram-recipes-*.mjs. Kommandoen node scripts/build-diagrams.mjs --write regenererer src/illustrations.json. De opprinnelige 15 diagrammene er videreført i src/diagrams.ts, med egen grunnskisse og variant for #16. Kildeendringer krever ny gjennomgang, ikke bare regenerering. Logoen er fra [Vålerenga Håndballs offisielle nettsted](https://www.vifhandball.no/) og ligger lokalt for offlinebruk.

## PWA og oppdatering

Tidligere aktiv worker beholdt gammel HTML og ventet på manuell aktivering. ACTIVATE_UPDATE fantes allerede og er videreført. Appen sjekker ved oppstart, forgrunn, tilbakevendende nett og hvert femte aktive minutt. Manuell «Se etter oppdateringer» viser sist kontrollert.

Ny worker precacher hele bygget. På startsiden aktiveres ferdig oppdatering automatisk etter sikker lagring. I planlegging, editor og hallmodus tilbys «Oppdater nå» og «Senere». controllerchange utløser én omlasting etter aktivering. Lagringsfeil stanser automatisk aktivering.

Navigasjon prøver nettet med tidsgrense. En annen HTML-versjon vises først når ny workers komplette cache er klar, slik at bygg ikke blandes. Offline brukes eksisterende shell. Forrige cache beholdes for eldre faner. Android kan stanse lukkede apper; sjekken gjenopptas ved åpning. Ingen reinstallasjon inngår i normal oppdatering.

Chromium-testene simulerer nye JS-filnavn og ressursinnhold og kontrollerer manuell/automatisk aktivering, databevaring, offline etter oppdatering og ingen omlastingsløkke. Dette erstatter ikke testing på fysisk Samsung-telefon.

## GitHub og publisering

Arbeidsgren: feature/handballtrener-3-0. check.yml tester grenen og pull requests. pages.yml publiserer fra main eller manuelt startet workflow. Relative ressursstier og hash-ruting støtter /H-NDBALLTRENER-N/.

Etter innfletting og vellykket Pages-workflow: kontroller [publisert version.json](https://levemannen.github.io/H-NDBALLTRENER-N/version.json) og synlig appversjon. Et lokalt bygg betyr ikke at Pages eller telefonen er oppdatert. Se AGENTS.md for versjonering og [RAPPORT-3.0.md](RAPPORT-3.0.md) for leveransestatus.
