# Sluttrapport – Håndballtrener’n 3.0

Arbeidet gjelder versjon **3.0.0**, på grenen **feature/handballtrener-3-0**. Produksjonsbygget, versjonsfilen og appkoden er kontrollert mot package.json. Originalteksten og øvelses-ID-ene i src/bank.json er uendret.

## A. Gjennomførte endringer

Appen er videreutviklet i eksisterende React/TypeScript/Vite-arkitektur. Den har flere separate lag, tydelig lagvelger, lagspesifikke utkast og historikk, konkrete varianter, lagdelingsregler, utvidet Plan B, femminuttersbank, teksteksport og ukeplaner. Alle funksjonene bruker lokal lagring og fungerer uten innlogging.

Migrering fra 2.1 knytter eksisterende spillerstall og treninger til første lag. Opprinnelige lagringsnøkler beholdes som reserve. Backup inkluderer alle nye datatyper. Uleselig lagring overskrives ikke automatisk; redningskopi inkluderer rådata og påbegynte endringer. Tomt registrert oppmøte respekteres. Arkiverte spillere velges ikke automatisk etter import. Kopiering beholder øvelser, varianter, minutter og kommentarer, men nullstiller gammel deltakelse, evaluering og gjennomført-status.

Egne diagrammer har forrang. En feil funnet under testing, der variantens trinn kunne havne under hovedøvelsen, er rettet og dekket av regresjonstester. Diagramtrinn og status bevares også når andre lagdata endres.

## B. Diagramstatus

| Kontroll | Resultat |
|---|---:|
| Hovedøvelser | 122 |
| Med illustrasjon/prinsippskisse | 122 |
| Med flere trinn | 10 |
| Gjennomgått mot kilden | 115 |
| Til trenergjennomgang | 6 |
| Trenger avklaring | 1 |
| Ugyldige diagramdata i kontrollen | 0 |
| Avkuttede symboler i renderingstesten | 0 |

Full oversikt over samtlige 122 øvelser, diagramtype, trinn og merknad: [DIAGRAMSTATUS.md](DIAGRAMSTATUS.md). Den genereres med `node scripts/diagram-report.mjs`. Kontrollsiden i appen er `#/illustrasjoner`.

De opprinnelige 15 oppsettene er gjennomgått og videreført. Øvelse 16 skiller nå mellom grunnøvelsens prinsippskisse og varianten med seks kjegler/fem spillere. Oppsett 28, 118 og 119 ble justert etter visuell kontroll for å unngå overlapp og skjult kjegle. Alle 122 er rendret; bildeoversikter er gjennomgått visuelt. Diagrammer er skjematiske og ikke uavhengig håndballfaglig godkjent.

Trenergjennomgang gjenstår for **54, 56, 69, 81, 110 og 121**, særlig praktisk organisering og sikker gjennomføring. **17, Fire soner – A/B**, trenger avklaring av A/B-plassering og ballrekkefølge. Disse begrensningene vises i appen.

## C. Mobil og PWA

Aktivt lag vises øverst, også i planlegger og hallmodus. Velgeren bytter lag og lagrer gjeldende utkast først. Mitt lag er tilgjengelig i hovednavigasjonen. Mobilvisning er testet ved 360 og 390 px, i tillegg til 768 og 1280 px. Ingen horisontal sideoverflow ble funnet i de testede flytene.

Den gamle oppdateringsmekanismen hadde allerede aktiveringsmelding, men beholdt aktivt cachet HTML og krevde manuell aktivering. Løsningen sjekker nå ved oppstart, forgrunn, tilbakevendende nett, hvert femte aktive minutt og manuelt. Ny worker laster ned hele bygget før aktivering. På startsiden aktiveres oppdateringen automatisk etter sikker lagring. Under redigering eller hallbruk velges Oppdater nå/Senere. Lagringsfeil stanser automatisk aktivering.

Navigasjon prøver nettet med tidsgrense, men serverer ikke et annet byggs HTML før det komplette nye bygget er klart. Offlinefallback og forrige cache er bevart. Testen leverer nye JS-filnavn og nytt ressursinnhold, og kontrollerer at de faktisk vises etter både manuell og automatisk aktivering. Spillerdata og utkast beholdes, offline virker etterpå, og ingen omlastingsløkke ble funnet.

Dette er **Playwright/Edge med Chromium-motor**, ikke verifisering på en fysisk Samsung. En lukket Android-app kan ikke garanteres å oppdatere før den åpnes.

## D. Synkronisering

En valgfri Supabase-klient og SQL-oppsett med autentisering, RLS og atomisk revisjonskontroll er implementert. Ingen hemmelig servernøkkel eller ekte spillerdata er lagt i repository. Innlogging starter synkronisering; appen fungerer fortsatt offline. Samtidige endringer stopper automatisk overskriving og lar brukeren eksportere og velge versjon.

Test med to isolerte enheter mot en **simulert tjeneste** består: innlogging, overføring, offlineendring og konflikt uten tap av noen av versjonene. Dette er ikke en live-test av Supabase eller SQL-tilgangskontrollen.

**Skyen er ikke konfigurert eller aktivert.** Brukeren må opprette prosjekt/konto, kjøre SQL, legge offentlig prosjektkonfigurasjon inn på begge enheter og gjennomføre test med to kontoer. Oppskriften står i [SYNC.md](SYNC.md). Eksport/import er et ferdig alternativ for privat manuell overføring.

## E. Treningsfunksjoner

- Varianter har stabil ID, originaltekst, utstyr og kobling for egne diagramtrinn. Sammenhengende progresjoner deles ikke vilkårlig opp. Varianter uten egen standardskisse viser tydelig merket hovedprinsipp og variantens tekst.
- Forslag bruker faser og felles ferdigheter, kjente rammer og redaksjonelle organisasjonsvurderinger. Én trener prioriterer enklere oppsett og mindre kø. Personalisering med favoritter/godt vurderte økter kan slås av. Ukjente metadata fremstilles ikke som dokumenterte.
- Lagdeling bevarer nivåskalaen og jevne størrelser. Sammen-/adskiltregler og låser respekteres, med forklaring ved umulig kombinasjon. Søket har en grense og varsler hvis den nås; det bryter ikke regler i stillhet.
- Plan B dekker færre spillere, vanskelig/enkel øvelse, kø, dårlig flyt og tid. Endringer krever valg. Originalplanen kan gjenopprettes etter omlasting.
- «5 minutter til overs» har 101, 2, 112, 100, 109, 94, 91, 111 og 113 i bestilt rekkefølge. Samlingen kan redigeres og inngår i backup/synkronisering.
- Kort/detaljert teksteksport har forhåndsvisning, kopiering, Web Share når tilgjengelig og .txt. Oppmøtenavn og individuelle nivåer utelates. Utklippstavlen er testet; Web Share-kallet er kontrollert med en simulert støttet API, ikke en fysisk Android-delingsmeny.
- Ukeplaner har tema, startdato, uker, økter per uke og progresjon. Uker kan redigeres og brukes til konkrete økter. Gjennomført-status registreres eksplisitt, og historikken beskriver treningsfokus, ikke objektiv spillerutvikling.

## F. Kvalitetssikring

Kjørt med Node.js 24.22.3 og pnpm 11.25.0:

| Kommando | Resultat |
|---|---|
| pnpm install --frozen-lockfile | Bestått |
| pnpm test | 41 tester bestått |
| pnpm build | Bestått, versjon 3.0.0 kontrollert |
| pnpm test:browser | Bestått: fire skjermstørrelser, 3.0-flyter, diagrammer og simulert synkronisering |
| tsc --noEmit --noUnusedLocals --noUnusedParameters | Bestått |
| node scripts/diagram-report.mjs | 122 oppsett, ingen ugyldige diagramdata |
| git diff --check | Ingen diff-feil |

Nettlesertestene dekker også berøringsflytting via Chromium Touch, to knekkpunkter, angre/gjør om, variantens diagramtrinn, datalagring, eksport/import, gamle backupdata, fanekonflikter, timer, Plan B-gjenoppretting og offline lagbytte. Testdata er syntetiske. Den opprinnelige øvelsesbanken har ingen diff.

Skjermbilder og kontaktark er produsert i den lokale tempmappen `handball-30-qa`. Testene kan gjenskape dem med SCREENSHOT_DIR. De er ikke bevis på fysisk Samsung-installasjon.

## G. GitHub og publisering

Arbeidsgren: **feature/handballtrener-3-0**. Commit-ID og resultat av opplasting oppgis i avslutningsmeldingen. Workflow for grenen/pull requests er utvidet til 3.0. Lokale tester er gjennomført; dette betyr ikke at GitHub Actions har kjørt eksternt.

Ingen innfletting i main eller publisering av 3.0 er utført i dette arbeidet. Pages-versjonen og telefonens installerte versjon kan derfor ikke oppgis som oppdatert. Etter innfletting må version.json og synlig versjon på Pages kontrolleres, deretter oppdateringsflyten på telefonen.

## H. Hva som fortsatt krever ekstern kontroll

1. Praktisk trenergjennomgang av de seks merkede oppsettene og avklaring av øvelse 17.
2. Eget Supabase-prosjekt og ekte konto-/tilgangstest før synkronisering med virkelige data.
3. Fysisk Samsung-installasjon, Android-delingsmeny og oppdatering på telefonen etter publisering.
4. Innfletting, ekstern GitHub Actions-kjøring og kontroll av faktisk Pages-publisering.

Disse punktene er ikke merket som fullført. Den lokale appen, migreringen og testet offlinebruk krever ikke at skytjenesten aktiveres.
