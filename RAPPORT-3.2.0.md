# 3.2.0 – fra plan til praksis

Arbeidet er gjort lokalt. Ingen commit, push, innfletting eller publisering er utført. Rapporten beskriver den prioriterte leveransen, ikke full oppfyllelse av alle detaljkrav i bestillingen. Fase 1 og 2 er prioritert, med konkrete forbedringer fra fase 3 og 4. Restpunkter står nedenfor.

## Implementert

- Forsiden viser pågående, dagens eller neste trening med direkte tilgang til oppmøte, lagdeling og redigering. Siste trening kan gjentas, og maler kan gjenbrukes. Synkronisering og oppdatering er flyttet ned fra toppen.
- Flere utkast per lag kan bevares og byttes mellom. Planleggeren har tidslinje med overgangstid, låsing av øvelser, fylling av ledig tid, tidsoptimalisering og angre. Eksisterende flytting, duplisering, kommentarer og varianter er beholdt. Ved øvelsesbytte fjernes gammel kommentar og variant.
- Forslag bruker individuelle øvelsesvurderinger og valget kjent/balansert/nytt. Øktkontroll skiller kjente rammebrudd, ukjente metadata og redaksjonelle råd. Utstyrslisten fjerner like linjer uten å summere behov for øvelser som foregår etter hverandre.
- Øvelsesbanken har kort, kompakte kort og liste, sortering, flervalg og angre siste tillegg. Angre fjerner bare de tilførte elementene. Visningsvalg huskes; detaljvisning kan returnere til tidligere rulleposisjon. Øvelsesvelgeren viser tilpasning til øktens rammer og allerede valgte øvelser. Ukjente spiller-/tidskrav utelukkes ikke automatisk.
- Hallmodus bruker en lagret timer med absolutt sluttid. Start, pause, justering, nullstilling, forrige/neste, hopp over og avslutning følger samme økt. Oppmøte, grupper, kort instruksjon, Plan B og femminuttersøvelser er tilgjengelige her. Fullskjerm, lyd, vibrasjon og skjermvåken er valgfrie, med nettleseravhengig støtte.
- En pågående trening bevares i arbeidsområdet og kan gjenåpnes uten sessionStorage. Timeren stopper registrert tidsbruk ved øvelsens sluttid; nattlige avbrudd blir ikke oppdiktede treningstimer. Automatisk appoppdatering holdes tilbake så lenge et lag har en aktiv trening. Manuell oppdatering bevarer lagrede data.
- Originalplanen bevares separat fra endret oppsett og registrert gjennomføring. Faktisk tid lagres per øvelsesforekomst og øvelses-ID. Kopiering kan ta utgangspunkt i originalplan eller siste oppsett. Eldre økter får ingen oppdiktede målinger.
- Plan B viser tilpasning før bytte og rangerer inntil tre alternativer ut fra problemet. Kø, organisering, aktivitet, liten hall, trenerbehov og dokumentert nivåtilpasning brukes der metadata finnes. Manglende utstyr krever trenerens kontroll av utstyrslisten; appen gjetter ikke at ukjent betyr utstyrsfritt.
- Oppmøte og lagdeling er integrert i trening. Sen ankomst og tidlig avgang registreres. Jevne lag, nivådelte lag, faste nivåintervaller, tilfeldig fordeling og gjenbruk av siste fordeling støttes. Flere navngitte oppsett, vestfarger, godkjenning/lås, manuelle bytter/flytting og angre/gjør om følger økten. Deling av lagtekst viser navn uten nivåer.
- Godkjente grupper endres ikke automatisk når oppmøtet endres. Handlingen for færrest endringer beholder eksisterende plassering når mulig og prøver deretter en lovlig fordeling. Lagregler kontrolleres ved generering, manuelle endringer og godkjenning. Ny godkjenning krever at alle fremmøtte er fordelt.
- Enkel kamprekkefølge viser par, hvilelag, kampvarighet og neste kamp ved tre eller flere lag.
- Mine treninger har søk også i øvelsesnavn, status-, dato-, hall- og tidsfilter, favoritt/arkivering og kopiering til andre lag uten spillerreferanser. Hurtig evaluering har valgfrie stikkord og vurdering per øvelse.
- Historikk skiller planlagte og registrerte minutter. Ferdighetstid fordeles mellom registrerte ferdigheter for å unngå dobbelttelling; dette er ikke måling av spillerutvikling.
- Faste treningsdager gir reelle datoer, klokkeslett, hall og varighet fra sesongperiodene. Generering oppretter utkast og hopper over eksisterende dato/tid i stedet for å overskrive.
- Illustrasjoner kan spilles av trinnvis, speiles i visningen og eksporteres som PNG. Kildeillustrasjoner endres ikke av avspilling eller speiling. Eksisterende redigering, trinnkopiering og fullskjerm er beholdt.

## Datamodell og bevaring

Lagringsformatet er fortsatt Workspace v3. Nye felt er valgfrie, slik at eldre sikkerhetskopier leses uten en destruktiv masseomskriving:

- `ClubTeam.drafts` inneholder parkerte utkast; `draft` er fortsatt aktivt utkast.
- `Session.runner`, `originalPlan`, `allocations`, `attendanceEvents`, `state`, `favorite`, `archived` og `variety` lagrer gjennomførings- og planleggingsdata.
- Øvelsesforekomster kan ha `locked`, `transition` og `allocationId`.
- Evaluering kan ha `tags` og vurderinger under `items`.
- Laginnstillinger kan ha `trainingDays`.

Feltene valideres ved lagring, import og synkronisering. Oppmøte, primær lagdeling, flere lagoppsett og oppmøtehendelser behandles samlet ved sammenslåing av redigerte økter. Ny timer og lagdeling beholdes når et eldre planutkast bare endrer andre felt. Permanent spillerfjerning rydder også nye referanser og parkerte utkast. Eksisterende Web Lock, sikkerhetskopi, redningskopi og synkroniseringsarkitektur er beholdt.

En gyldig eldre sessionStorage-timer kan overføres ved åpning. Ingen historisk tidsbruk beregnes bakover ved denne overføringen. Original spillerfil med 19 spillere, nivåskalaen, øvelsesbankene og logofilen er uendret.

## Filer

Nye grensesnittkomponenter: `SessionHome.tsx`, `SessionRunner.tsx`, `SessionPlayers.tsx`, `SessionEvaluation.tsx`, `SessionTimeline.tsx`, `SessionHistory.tsx`, `TrainingCalendar.tsx`.

Ny separat logikk: `sessionFlow.ts`, `sessionPlanning.ts`, `allocation.ts`.

Videreutviklet: `main.tsx`, `Training.tsx`, `Bank.tsx`, `Team.tsx`, `Illustration.tsx`, `Updates.tsx`, `model.ts`, `workspace.ts`, `sessionMerge.ts`, `season.ts`, `style.css`.

Nye tester: `workflow320.test.mjs`, `browser-workflow320.mjs`. Eksisterende `browser.mjs` og `browser-v3.mjs` følger den nye hall- og oppdateringsflyten. Gamle databevaringskontroller er beholdt. Dokumentasjon: denne rapporten, `PLAN-3.2.0.md` og README.

## Testresultater

Sluttkontroll gjennomført 25. november 2026. Ingen kjente gjenværende feil i de kjørte testene.

Referanse før endringene: 56 enhetstester, produksjonsbygg, samlet nettlesertest og mobiltest bestod.

| Kontroll | Faktisk resultat |
| --- | --- |
| pnpm test | 77 av 77 bestått, inkludert 21 nye tester |
| pnpm test:browser | Bestått: 360, 390, 768 og 1280 px; migrering, lagbytte, backup/import, deling, timer, offline, fanekonflikt og eldre regresjoner |
| Illustrasjonskontroll i nettleser | Alle 122 hovedøvelser og diagramtrinn renderte uten avkuttede symboler eller JavaScript-feil |
| Synk mot simulert tjeneste | Bestått: to enheter, innlogging, overføring, offline, konflikt og bevart valg om automatisk synk |
| Offentlig spillerfil | Bestått: 19 spillere med riktige navn og nivåer, også offline |
| Ny 3.2-arbeidsflyt | Bestått: flere utkast, lagoppsett, godkjenning, sen ankomst, tidlig avgang, manuell flytting/angre, Plan B, originalplan, gjenåpning, offline, trygg PWA-oppdatering, avslutning, evaluering, PNG og angre i bank uten tap av senere endringer |
| Komplett mobiltest | Bestått: lys 320/360/390/412/768/1280 px; mørk 320/390; 200 % tekst 320/390; simulert tvungen mørk 390. Bred tekst i detaljvisning er også kontrollert |
| pnpm build | Bestått med TypeScript, offentlig spillerfil og versjonssamsvar |
| Endelig 3.2.0-bygg | Nytt bygg og ny 3.2-arbeidsflyttest bestått etter versjonsendring. dist/version.json og synlig appversjon viser 3.2.0 |
| git diff --check | Ingen whitespace-feil; vanlige Windows LF/CRLF-varsler |

Skjermbilder er lagret lokalt under qa/3.2.0 og qa/3.0.1 (git-ignorert). Forside på mobil/desktop, planlegger og hallvisning er også visuelt inspisert. En overlapp fra faste hallknapper ble funnet og rettet; kontrollene følger nå siden. En gammel Plan B-test ble oppdatert til den nye eksplisitte spillerantallhandlingen, med kontroll av både endring og gjenoppretting.

Ingen lintkommando er konfigurert. Ingen av disse kontrollene er fysisk testing på Samsung, live testing av Supabase/RLS eller kontroll av publisert Pages. Ikke alle 35 akseptansescenarioer har hver sin automatiserte test; de gjenværende detaljkravene nedenfor er ikke godkjent som ferdige.

## Avgrensninger og gjenstående detaljkrav

- Øvelsesbanken og innbyggingsvelgeren deler søk/rammevurdering, men har ennå ikke helt likt filtergrensesnitt. Navngitte filteroppsett, full kontekstfiltrering fra aktiv økt og lagring av alle søkevalg på tvers av omstart gjenstår.
- Hurtig/avansert planlegging er samme plan med flere felt, ikke to separate veivisere. Innsetting direkte før/etter et valgt element og en egen handling for helt ny variant av hele økten gjenstår. Tillegging og eksisterende flytting fungerer.
- Forslagslogikken er fortsatt regelbasert. Den gir ikke en full progresjonsanalyse eller statistisk læring fra evalueringer i tilsvarende hall-/spillerkontekst. Ukjent metadata begrenser rådene.
- Utstyrslisten tolker ikke mengder, sammenligner ikke med tilgjengelig beholdning og lager ikke en komplett riggeplan. Plan B ved mindre plass/færre trenere krever fortsatt at treneren kontrollerer og justerer rammene.
- «Færrest mulig endringer» er en heuristikk, ikke en garanti for matematisk minimum eller optimal nivåbalanse. Tilfeldig fordeling bruker lovlige bytter og er ikke uniform sampling av alle mulige lag. Sterke sammen-/låseregler kan begrense variasjonen.
- Treningens øvelser kan kobles til lagoppsett i avansert planlegging, men hallpanelet velger ikke automatisk oppsett ved hvert øvelsesbytte. Kamprekkefølgens aktive kamp er midlertidig visning og lagres ikke ved omstart.
- Originalplan og målte minutter vises, men det finnes ikke en full kronologisk logg over alle erstatningsgrunner og planendringer. «Gjennomført oppsett» betyr siste oppsett, ikke en filtrert liste over bare målte øvelser.
- Kalenderen er en datert liste med utkastgenerering, ikke en full dra-og-slipp-kalender. Flytting gjøres ved å åpne utkastet. Et utkast som slettes kan genereres igjen ved ny masseoppretting; det finnes ikke permanent avlysningsmarkør.
- Illustrasjonseditoren krever fortsatt eksplisitt lagring. Automatisk lagring og egen knapp for å gjenopprette kildeillustrasjonen gjenstår.
- Ny rask evaluering har ingen bekreftelsesside; den lagres ved valg. Eldre økter uten timer beholder ukjent faktisk tid. Brukshistorikken teller planlagte forekomster, og oppsummerer bare faktisk tid som er registrert med timeren.
- Det er ikke gjennomført produksjonssynk mot en ekte Supabase-konto eller publisering på GitHub Pages. Automatiserte tester bruker isolerte nettleserdata og testserver, ikke brukerens spillerstall eller vanlige appinstallasjon.

## Manuell kontroll før publisering

1. Eksporter sikkerhetskopi fra den vanlige appen.
2. Prøv en reell trening på Samsung: låst skjerm, bytte til annen app, frakoblet nett og gjenåpning. Kontroller lyd, vibrasjon, skjermvåken, deling og fullskjerm i telefonens faktiske nettleser.
3. Kontroller et ekte lagoppsett med lagets regler, sent oppmøte og tidlig avgang. Vurder øvelsesforslag og nivåtilpasninger håndballfaglig.
4. Hvis privat synk brukes, prøv nye øktdata på to egne enheter etter sikkerhetskopi. Nettlesertestene erstatter ikke denne kontrollen.
5. Bruk GitHub Desktop til commit og push. Kontroller diffen og flett riktig gren inn i `main`. La GitHub Actions bli grønn.
6. Etter publisering: åpne Pages sin `version.json`, kontroller 3.2.0 og bruk appens oppdateringsknapp. Kontroller også versjonen som vises i appen. Lokal godkjenning dokumenterer ikke at Pages er oppdatert.

Versjonen styres bare fra `package.json`; `pnpm build` genererer og kontrollerer versjonsfil, synlig appversjon og PWA-bygget.
