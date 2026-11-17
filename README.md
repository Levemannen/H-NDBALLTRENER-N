# Håndballtrener’n 2.1

React/TypeScript/Vite-app for planlegging, øvelsesbank, hallmodus og lagdeling. Brukerdata lagres på enheten. Ingen server, konto eller ekstern KI kreves.

## Kjøring og kvalitetssikring

Node.js 24, pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm dev
```

Nettlesertester mot produksjonsbygget:

```sh
pnpm exec playwright install chromium
pnpm test:browser
```

Testene starter en isolert lokal server under `/handball/` og bruker separate nettleserprofiler med syntetiske spillere. De bruker aldri spillerdata fra den vanlige nettleseren. `EDGE_PATH` kan peke til installert Edge. `SCREENSHOT_DIR` kan brukes for skjermbilder. Testene dekker 360, 390, 768 og 1280 px, utkast, treninger, oppmøte, lagdeling, arkivering, kopiering, eksport/import, timer, offline, fanekonflikter, SVG-redigering og service-worker-oppdatering.

## Nytt i 2.1

- Automatisk lagring av utkast med 450 ms forsinkelse, ekstra lagring ved skjuling/lukking, gjenoppretting, forkasting og eksport. Redigering av en lagret trening endrer bare utkastet frem til Lagre.
- Validering før datalagring. Web Locks gjør at bare én fane kan redigere. Eksakt sammenligning av lagret verdi før skriving oppdager også endringer fra eldre appfaner. Andre faner åpnes skrivebeskyttet; lukk redigeringsfanen og last siden på nytt for å overta.
- Arkivering og gjenaktivering bevarer historisk oppmøte og lagfordeling. Separat permanent sletting forklarer og fjerner referansene.
- Lagdeling med lokale spillerbytter som forbedrer poengfordelingen, jevn lagstørrelse og deterministisk resultat. Direkte spillerbytte, flytting, navn og ønsket gruppestørrelse. Ny fordeling krever bekreftelse når en fordeling finnes.
- Kopier og malbruk nullstiller oppmøte, lagfordeling og evaluering. Registrert oppmøte, også null, har forrang over forventet spillerantall.
- Regelbaserte treningsforslag med faseinndeling, dokumenterte spiller-/tidsrammer og trenerkrav. Alternativforslag bruker felles ferdighet/kategori og kjente rammer. Ukjente krav behandles som ukjente.
- Øvelsesvelger med kategori, favoritter og kortforklaring; duplisering, variantvalg, bytte, tid, kommentarer og rekkefølge. Valgt variant følger med til hallmodus.
- Trenerfilter bruker tilgjengelig kapasitet. Gymsal og liten hall deler egnethetsgruppe; dette er en redaksjonell normalisering, ikke oppmåling av hallen.
- SVG-editor har duplisering og redigerbare pilendepunkter/buepunkt, i tillegg til berøring, angre/gjør om, symboler og tekst.
- Halltimer med ±2/5 minutter. Enkel Plan B for kildebasert nivåtilpasning og tidsjustering av gjeldende øvelse, med bekreftelse.
- Oppdateringsknapp for nye offlineversjoner. Den aktive versjonen endres først ved brukerens valg. Utkast lagres før omlasting. Forrige ressurscache beholdes for åpne eldre faner.
- Offisiell Vålerenga Håndball-logo og kvadratisk SVG-appikon med den originale logoen, tilgjengelig offline.

## Databevaring

Lagringsnøkkelen er fortsatt `handballtrenern.v1`. Nye felt er valgfrie; eksisterende v1-data trenger ingen destruktiv konvertering. Øvelses-ID-er er uendret. Utkast ligger i `handballtrenern.draft.v1`. Eksport inkluderer utkast, lag, spillere, treninger, favoritter, notater, egne øvelser og illustrasjoner. Import validerer før erstatning og krever bekreftelse. Uleselige eksisterende data overskrives ikke automatisk. En redningskopi kan eksporteres fra feilmeldingen/utkastmenyen.

Data følger nettleser og adresse, ikke GitHub-konto. Sikkerhetskopier må overføres privat mellom PC og telefon. Ingen faktiske spillerlister inngår i kildekoden.

## Kilde og diagrammer

Banken har 205 unike oppføringer: 122 nummererte hovedøvelser, fire tilleggsbanker og 11 uavklarte oppføringer. Originaltekst og ID-er er bevart. Reimport fra brukerens Master v3-dokument 17. november 2026 ga ingen innholdsendringer. Originaltekst, redaksjonelle metadata og brukerens egne tilpasninger er separate.

Diagrammer finnes for 16, 20, 22, 23, 24, 26, 34, 48, 62, 66, 72, 85, 117, 119 og 120. De er prinsippskisser basert på kildebeskrivelsene, ikke målfaste oppsett eller en uavhengig trenerfaglig godkjenning. Øvelse 16 har to visningstrinn. Brukerillustrasjoner har forrang. Andre øvelser beholder en tydelig plassholder.

Logo: [Vålerenga Håndballs offisielle nettsted](https://www.vifhandball.no/), lagret i `public/valerenga-handball.png`.

## Publisering

Arbeidsgren: `feature/handballtrener-2-1`. `check.yml` tester endringer og pull requests uten å publisere. `pages.yml` publiserer bare `main` eller manuelt startet workflow. Bygg bruker relative ressursstier og hash-ruting, også under `/H-NDBALLTRENER-N/`.

Actions-versjoner er kontrollert mot offisielle utgivelser: [checkout 7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node 7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0), [pnpm 6.1.1](https://github.com/pnpm/action-setup/releases/tag/v6.1.1), [configure-pages 6.0.0](https://github.com/actions/configure-pages/releases/tag/v6.0.0), [upload-pages-artifact 5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0), [deploy-pages 5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1).

## Avgrensninger og videre arbeid

- Flere separate lag er ikke implementert. Dette trenger egen, testet migrering; dagens lag og historikk beholdes samlet.
- Forslag tar ikke hensyn til en full utstyrsliste, aktivitetsnivå, kø, stasjonsantall eller låste spillere. Slike krav må registreres og kvalitetssikres først.
- Plan B for færre spillere viser veien til oppmøteredigering; den gjør ikke automatisk om hele økten. Tidsjustering endrer gjeldende øvelse, ikke hele tidsbudsjettet.
- Flere diagramtrinn for alle øvelser, pil med flere knekkpunkter og låsing av spillere er ikke implementert.
- Nettlesertestene bruker Chromium/Edge. Fysisk Samsung-installasjon, Firefox på telefon og garanterte bakgrunnsalarmer er ikke verifisert.
- Ny produksjonspublisering må verifiseres etter innfletting i main. En vellykket lokal bygging betyr ikke at GitHub Pages er oppdatert.
