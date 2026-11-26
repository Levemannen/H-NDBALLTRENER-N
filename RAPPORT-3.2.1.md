# HÅNDBALLTRENER’N 3.2.1 – kvalitetsrapport

Dato: 26. november 2026. Arbeidet er gjort lokalt. Ingen commit, push, merge eller publisering er utført. GitHub Pages er ikke kontrollert som del av denne leveransen.

## Feil som er rettet

| Funn og reproduksjon | Årsak og konsekvens | Løsning og test |
| --- | --- | --- |
| Bytt øvelse, endre oppmøte eller lag, og angre byttet. | Hele øktkopier ble brukt som angregrunnlag; nyere arbeid kunne forsvinne. | `sessionEdits.ts`, `useSessionEdits.ts`, `Training.tsx`, `SessionPlayers.tsx` og `SessionRunner.tsx` bruker feltvise endringer mot siste tilstand. Konflikter avvises med forklaring. Enhetstester A og realistisk nettleserflyt. |
| Endre praktisk spillerantall i Plan B. | Forventet antall og navngitt oppmøte ble blandet, og oppmøte ble nullstilt. | `model.ts`, `sessionAttendance.ts` og hallvisningen skiller forventet, navngitt, praktisk og øvelsesspesifikt antall. 17 navn beholdes ved praktisk antall 16 eller 18. |
| Knytt ulike lagoppsett til to øvelser og trykk Neste. | Hallvisningen fulgte ikke øvelsens oppsettreferanse. | Automatisk oppsett fra øvelsen, uttrykkelig manuell overstyring og varsel om manglende referanse. Nettlesertesten kontrollerer begge oppsettene og gjenåpning. |
| Registrer en sen spiller etter godkjenning. | Godkjenning kunne fremstå gyldig for foreldet oppmøte. | Ufordelte, fraværende og duplikater synliggjøres. Godkjente grupper endres ikke automatisk. Oppsett oppdateres på samme plass i listen. |
| Tilpass sterkt skjeve grupper eller faste nivågrupper. | Minste endring tok ikke tilstrekkelig hensyn til nivå, antall grupper eller fast inndeling. | `allocation.ts` beholder plasseringer der det går, sjekker regler og størrelse og forbedrer nivåbalanse. Faste nivågrupper kan være ulike og tomme. Test med 17→18→17, regler og sterke nivåforskjeller. |
| Start/pause 20 ganger med et halvt sekund mellom. | Avrunding per intervall ga null registrerte sekunder i stedet for ti. | `sessionFlow.ts` summerer millisekunder og beholder sekundfeltet for kompatibilitet. Absolutt tidsfrist begrenser registrering ved lange avbrudd. |
| Bytt delvis gjennomført øvelse og start samme øvelse igjen. | Historikk og vurdering brukte øvelse/planelement som identitet. | Unik gjennomførings-ID med øyeblikksbilde, målt tid og egen vurdering. Gamle gjennomføringer beholdes. C/D-tester og nettleserflyt. |
| Hopp over siste øvelse flere ganger. | Samme handling opprettet flere historikkposter. | Siste hopp er idempotent. Avsluttede økter kan ikke startes eller endres gjennom hallkontrollene. Tom økt håndteres uttrykkelig. |
| Angre innsetting av øvelsen som timeren peker på. | Aktiv referanse kunne bli hengende etter at elementet forsvant. | Avvises til treneren velger en annen øvelse. Målinger bevares; egen regresjonstest. Samme vern brukes ved gjenoppretting av originalplan. |
| Kopier faktisk gjennomføring etter tidlig avslutning. | Planlagte, hoppede og gjennomførte øvelser kunne blandes. | Tre kopieringsvalg. Faktisk kopi bruker målte eller uttrykkelig bekreftede forekomster; ukjent gjennomføring blir ikke oppdiktet. |
| Åpne et eldre utkast etter at timeren har registrert ny aktivitet. | Utkast kunne erstatte nyere gjennomføringsfelter. | `sessionMerge.ts` beholder lagret timer, hendelser og originalplan. Redigering av pågående økt ledes til hallvisningen. |
| Planlegg 56 minutter øvelser og 4 minutter overgang. | En teller viste 60 av 60, men samtidig 4 minutter ledig. | Samme `plannedMinutes` brukes i tidslinje, summer, ledig tid, lister og forslag. Bekreftet i skjermbilde og nettlesertest. |
| Avslutt etter å ha åpnet lag og femminuttersbanken. | Evalueringen havnet langt nedenfor mange inaktive kontroller. | Evalueringen vises først; oppmøtepanelet og hurtigbanken lukkes ved avslutning. |

## Forbedringer

- Plan B vurderer oppdaterte rammer for hall, trenere, spillere, utstyr og tid. Ukjente krav markeres, og ingen treff forklares. Forslag for kø og uro prioriterer relevante aktivitets- og organiseringsopplysninger.
- Femminuttersøvelser kan startes nå, settes inn etter aktuell øvelse, legges til på slutten eller erstatte aktuell øvelse. Ved bytte velges gjenværende tid eller ny varighet.
- Nye planvarianter prioriterer alternative øvelser. Låste elementer beholder identitet, plass og detaljer. Tidsoptimalisering fordeler endringer mellom ulåste øvelser innenfor kjente intervaller.
- Øvelsesbank og velger deler filterlogikk, metadataoverstyringer og sortering. Øktfilter kan slås av. Innsetting før/etter, flervalg, kompakt velger og lagrede filterkombinasjoner er tilgjengelig.
- Lyd, vibrasjon og skjermvåken lagres i arbeidsområdet. Skjermvåken frigjøres ved avslutning og avmontering; manglende nettleserstøtte forklares.
- Kampindeks og varighet lagres per oppsett. Kamprekkefølgen forsøker å spre hvile. Kalenderen beholder avlysninger og opprinnelig tidsluke ved flytting, slik at ny generering ikke lager duplikater.
- Forsiden prioriterer pågående økter og viser utkast. Avlyste økter blir ikke dagens anbefalte trening.
- Egen illustrasjon kan erstattes med kildeillustrasjonen etter bekreftelse, uten å endre andre varianter.

## Databevaring og kompatibilitet

Modellen er utvidet med valgfrie felter: praktisk/øvelsesspesifikt spillerantall, oppsettstype og kampstatus, aktiv oppsettoverstyring, kalenderopprinnelse/avlysning, millisekunder, gjennomførings-ID og øvelsesøyeblikksbilde, hendelser, forekomstvurderinger, hallinnstillinger og filteroppsett. Arbeidsområdet beholder eksisterende format og lagdeling.

Eldre sekundmålinger brukes som de er. Eldre poster uten ID får deterministisk identitet ved lesing; det konstrueres ikke tidsmålinger eller forekomstvurderinger. Gamle generelle øvelsesvurderinger vises som historiske vurderinger. Nye valgfri felter valideres ved import. Backup rundtur testes med både gamle og nye felter. Synkronisering bruker fortsatt samme arbeidsområdepayload og konfliktmodell; ingen ny serverarkitektur er innført.

Offentlig spillerfil, masterbank, tilleggsbanker, logo og kildeillustrasjoner er ikke endret. Brukerens virkelige lokale lagring er ikke åpnet eller omskrevet i testene. Testene bruker isolerte serverporter og syntetiske spillere.

## Testdekning

Referansekjøring før endring: installasjon med låsefil, 77 enhetstester, produksjonsbygg, full nettleserpakke og full mobilpakke bestod.

Nye tester ligger i `tests/quality321.test.mjs` og `tests/browser-quality321.mjs`. Den realistiske flyten kjøres både ved 390 og 1280 pikslers bredde. Den omfatter 17→18→17 spillere, tre godkjente lag, alternativt nivåoppsett, automatisk oppsett, Plan B, separat angre, tidsjustering, offline omlasting, ny nettleserkontekst med lagret arbeidsområde, femminuttersøvelse, tidlig avslutning, ulike forekomstvurderinger, faktisk kopi og backupvalidering. I tillegg testes kampstatus etter omlasting, innsetting før/etter og lagrede filtre.

Dekningen nedenfor viser forholdet til bestillingens 85 scenarioer. Dette er ikke en påstand om 85 separate automatiserte ende-til-ende-tester.

| Scenarioer | Kontroll og avgrensning |
| --- | --- |
| A 1–4, 6 | Enhetstester for uavhengige felt, senere timer og konflikt; nettleser for angre etter oppmøte/lag/tidsendring. |
| A 5 | Angrestakken er lokal for den åpne visningen og gjenopprettes ikke etter navigasjon. Lagrede øktdata gjenopprettes; gammel angreknapp tilbys ikke. |
| B 7–17, 19–20 | Enhetstester og realistisk flyt. Regler, balansering, faste ulike/tomme grupper og navngitte oppsett er kontrollert. |
| B 18 | Enhetstest for manglende/slettet referanse; ingen ny slettingsknapp er lagt til. |
| B 21–23 | Nettleserflyten kontrollerer manuelt bytte og bytte tilbake, avmerking og nullstilling av valgt spiller ved oppsettbytte. |
| B 24 | Kampindeks og varighet kontrolleres etter nettleseromlasting og i backup. |
| C 25–40, 42–43 | Enhetstester med kontrollert tid og nettleserflyt. Overgangstid inngår i planberegninger; den har ikke en separat automatisk riggetimer. |
| C 41 | Lange tidsavbrudd simuleres med tidsstempler. Fysisk skjermlås og mobilens bakgrunnsregler er ikke testet. |
| C 44 | Simulert Wake Lock verifiserer forespørsel, frigjøring ved navigasjon, ny forespørsel ved retur og frigjøring ved avslutning. Fysisk API-atferd gjenstår. |
| D 45–55 | Enhetstester for gjentakelser, delvise bytter, hopp, gamle vurderinger og tre kopier. Nettleseren vurderer ulike forekomster og kopierer faktisk gjennomføring. |
| D 56 | Historikkens beregningsgrunnlag er kodekontrollert og visuelt gjennomgått; målt tid skilles fra ukjent/planlagt. Ingen ny omfattende statistikkmodul. |
| E 57–68 | Enhetstester for rammer, ingen treff, kontekstuell historikk, låste posisjoner og overgangstid. Nettleser tester køforslag og praktisk antall. |
| E 69–70 | Nettlesertest verifiserer riktig innsettingsposisjon og at eksisterende elementer bevares. |
| F 71–73 | Enhetstest av avlysning, flytting, overlapp og ugyldige kalenderdatoer. Kalenderens knapper er ikke alle testet som separate UI-flyter. |
| F 74–76 | Eksisterende migreringstester og nye rundturtester med gamle/nye felt. Ingen privat historisk produksjonsbackup brukes. |
| F 77–78 | Eksisterende simulerte synkroniseringstester og beskyttelse mot eldre utkast. Reell Supabase-konto er ikke testet. |
| F 79–81 | Offline omlasting/gjenåpning og PWA-oppdateringsvern i nettleserpakken; eksisterende tester for lagbytte. Hele treningsforløpet gjennomføres ikke utelukkende offline. |
| F 82–85 | Ordinær full nettleserpakke, 122 SVG-illustrasjoner, bredder 320–1280, mørk visning, 200 % tekst og eksisterende 3.2-regresjoner. |

Skjermbilder ligger lokalt i den git-ignorerte mappen `qa/3.2.1/`. Forside, oppmøte, lagdeling, planlegger, hall, Plan B, evaluering og historikk tas ved begge bredder. Visuell kontroll avdekket tidsmotstriden og den lange veien til evalueringen; begge er rettet. Fast bunnmeny vises ved første skjermhøyde i lange helsidebilder og er fortsatt fast i vanlig bruk.

## Begrensninger og videre kontroll

- P2-beskyttelse av ulagrede illustrasjonsutkast ved navigasjon er ikke utvidet i denne runden. Lagre illustrasjonen før du forlater editoren. Dette er holdt utenfor for å prioritere P0/P1 og unngå en ny global navigasjonsmekanisme.
- Angre er avgrenset og konservativt: nyere endring i samme felt eller omorganisert liste kan gi konflikt fremfor automatisk sammenslåing. Registrert timerhistorikk rulles aldri tilbake. Justert timertid beholdes derfor også når en planendring angres.
- Minimal lagendring er en heuristikk, ikke en garanti for matematisk færrest flyttinger. Nivåtoleransen er 0,7; regler og gruppestørrelser kan gjøre den uoppnåelig. Treneren ser resultatet og godkjenner det uttrykkelig.
- Plan B bygger på tilgjengelige metadata og redaksjonelle vurderinger. Utstyrssøk bruker teksttreff; det er ingen full lager-/mengdemodell. Ukjente krav må vurderes av treneren.
- Korte målte forekomster kan avrundes til 0,0 minutter i visningen, mens millisekundene bevares. En ny plan fra faktisk gjennomføring bruker hele minutter, minst ett per målt forekomst. Manglende målinger blir ikke fylt inn automatisk.
- Oppdaterings-, lagrings- og synkroniseringstester er isolerte simuleringer. Fysisk Samsung, faktisk lyd/vibrasjon, skjermlås, nettleserens bakgrunnsbegrensninger og reell Supabase-synkronisering bør kontrolleres før praktisk bruk.
- Ingen kontroll av publisert Pages-versjon er utført. Etter eierens publisering må `version.json` og synlig appversjon kontrolleres; en eldre åpen app må bruke oppdateringsknappen.

## Endelig testkjøring

| Kontroll | Resultat |
| --- | --- |
| `pnpm install --frozen-lockfile` | Bestått; ingen endring i låsefil. |
| `pnpm test` | 103 bestått, 0 feilet, 0 hoppet over. Før endring: 77. |
| `pnpm build` | Bestått, inkludert TypeScript, offentlig spillerfil og versjonskontroll. |
| `pnpm test:browser` | Full ordinær pakke bestått. Utvidet flyt med manuelt bytte og Wake Lock ved navigasjon er også kjørt i full pakke og bestått. |
| `pnpm test:mobile` | Alle 11 kombinasjoner bestått: lys 320/360/390/412/768/1280, mørk 320/390, 200 % tekst 320/390 og simulert tvungen mørk visning 390. |
| Versjon | `package.json`, generert `dist/version.json`, bygget appkode og synlig versjon i nettleserbildene viser 3.2.1. |
| Git-kontroll | `git diff --check` uten feil. Ingen endring i offentlig innhold, bankfil, kildeillustrasjoner eller låsefil. |

Lokale logger: `qa/3.2.1/final-install.log`, `final-unit.log`, `final-build.log`, `final-browser.log`, `final-browser-expanded.log` og `final-mobile.log`. Skjermbilder fra den nye flyten har prefiks `321-390-` og `321-1280-`. Testdata er syntetiske. Ingen av disse resultatene bekrefter publisering på GitHub Pages.
