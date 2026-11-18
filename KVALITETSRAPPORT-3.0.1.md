# Kvalitetssjekk av Håndballtrener’n 3.0.1

Dato: 18. november 2026. Kontrollert lokal kode: `d596e42`, gren `codex/handballtrener-3-0-1`. Dette er en gjennomgang med feilregistrering og forslag; appkoden er ikke rettet eller versjonsnummeret endret i denne runden.

## Vurdering

De eksisterende automatiske testene passerer. Ekstra tester av samspill mellom funksjoner avdekket likevel **seks bekreftede funksjonsfeil**, ett tilgjengelighetsproblem i kodegjennomgangen og ett sikkerhetsvarsel i utviklingsavhengighetene. Jeg anbefaler å rette de to P1-feilene før neste publisering og ta de øvrige funksjonsfeilene i samme rettingsrunde.

P1 betyr høy prioritet fordi data kan overskrives eller appen bli ubrukelig i den beskrevne situasjonen. P2 betyr en avgrenset funksjonsfeil som bør rettes. Sikkerhetsdatabasens alvorlighetsgrad er oppgitt separat fra prioriteringen for denne appen.

## Registrerte funn

| ID | Prioritet | Problem | Verifikasjon |
| --- | --- | --- | --- |
| F01 | P1 | Ugyldige lagdelingsregler slipper gjennom backupvalideringen og kan gi helt tom appside | Gjenskapt i parser og nettleser |
| F03 | P1 | Et åpent øktutkast kan overskrive nyere oppmøte på samme lagrede økt | Gjenskapt gjennom brukergrensesnittet |
| F02 | P2 | «Alle spillere» tar ikke med en nyimportert spiller mens lagdelingen allerede er åpen | Gjenskapt: 16 spillere, bare 15 valgt |
| F04 | P2 | Samme spillerimport på to enheter kan gi unødvendig skykonflikt | Gjenskapt med import- og synkroniseringsfunksjonene |
| F05 | P2 | Feil Supabase-adresse kan ikke rettes eller kobles fra i appen | Gjenskapt gjennom brukergrensesnittet |
| F06 | P2 | Avslått automatisk synkronisering slås på igjen ved ny lasting | Gjenskapt med simulert innlogging |
| F07 | P2 | Nye diagramsymboler kan ikke plasseres med bare tastatur | Bekreftet i hendelser og kontroller i kildekoden |
| S01 | P2 i dette prosjektet | Sikkerhetsvarsel i picomatch via Vite; databasen graderer det «high» | `pnpm audit` og publisert sikkerhetsmelding |

### F01 – backup med ugyldige regler gir tom side

**Sted:** [workspace.ts, linje 25](src/workspace.ts#L25), [Team.tsx, linje 60](src/Team.tsx#L60).

`parseWorkspace` sender spiller- og øktdata videre til `parseData`, men utelater lagets `groupRules`. Dermed kontrolleres ikke dette feltet av den eksisterende regelvalidatoren. En ellers gyldig sikkerhetskopi med `teams[0].groupRules = {"invalid": true}` blir akseptert. Åpning av Mitt lag gir deretter `o.filter is not a function` og tom side. Testen endret bare syntetiske data i en isolert nettleser.

**Forslag:** Valider `groupRules` for hvert lag før data kan importeres, synkroniseres eller lagres. Behold den siste gyldige versjonen ved feil. Legg i tillegg inn en feilvisning som tilbyr redningskopi hvis en komponent likevel krasjer.

**Godkjenningskrav:** Objekt, tekst, ugyldige regler og ugyldige lagnumre skal avvises uten å endre eksisterende data. Gyldige eldre sikkerhetskopier skal fortsatt fungere.

### F03 – nyere oppmøte overskrives av gammelt utkast

**Sted:** [main.tsx, linje 48](src/main.tsx#L48), [main.tsx, linje 55](src/main.tsx#L55), [Team.tsx, linje 73](src/Team.tsx#L73).

**Gjenskaping:** Åpne en lagret trening med «Åpne / rediger». Gå til Mitt lag og velg den samme lagrede treningen under Oppmøteliste. Registrer og lagre oppmøte. Gå tilbake til Lag trening og lagre det allerede åpne utkastet. Testen gikk fra **ett lagret oppmøte til null** uten konfliktvarsel.

Årsaken er at redigering tar en kopi av hele økten. Senere lagring erstatter hele den lagrede økten med denne kopien, også felt som ble oppdatert et annet sted etter at kopien ble tatt. Tilsvarende risiko finnes for lagfordeling og evaluering; selve gjenskapingen her gjelder oppmøte.

**Forslag:** Registrer hvilken øktrevisjon utkastet bygger på. Ved lagring må appen enten slå sammen felt som ikke er endret i utkastet, eller be om avklaring hvis den lagrede økten er endret. Unngå ubetinget erstatning av hele objektet.

**Godkjenningskrav:** Nytt oppmøte og ny evaluering skal overleve lagring av en eldre kopi av treningsplanen. Reelle samtidige endringer i samme felt skal gi et tydelig valg.

### F02 – nytt navn mangler i «Alle spillere»

**Sted:** [Team.tsx, linje 17](src/Team.tsx#L17).

Spillerutvalget opprettes i lokal komponenttilstand når Mitt lag åpnes. Ved senere import oppdateres spillerlisten, men ikke dette utvalget. Testen startet med 15 spillere, importerte spiller 16 og viste fortsatt «Alle spillere» samtidig som bare 15 var valgt. Den nye spilleren kan dermed bli utelatt fra lagdeling.

**Forslag:** Skill mellom «alle aktive spillere» og et manuelt utvalg. Når alle-modus faktisk er valgt, avled utvalget fra gjeldende spillerliste. Bevar bevisste manuelle fravalg og vis dem som et eget utvalg. Ikke legg nye spillere automatisk til historisk oppmøte.

**Godkjenningskrav:** Ny import skal gi 16 av 16 i alle-modus, mens historiske økter og manuelle utvalg beholder sine eksplisitte valg.

### F04 – importtidspunkt skaper skykonflikt

**Sted:** [rosters.ts, linje 61](src/rosters.ts#L61), [syncDecision.ts](src/syncDecision.ts).

To enheter med samme utgangspunkt importerte samme nye rosterrevisjon. Lag og spillere ble identiske. Bare `rosterImport.importedAt` var forskjellig. Synkroniseringsbeslutningen ble likevel `conflict`, fordi hele arbeidsområdet sammenlignes, inkludert det lokale kontrolltidspunktet.

Dette er ikke påvist datatap, men brukeren må velge mellom tilsynelatende forskjellige versjoner selv om innholdet er likt. Testen gjenskaper beslutningen med ekte appfunksjoner, ikke med en live Supabase-server.

**Forslag:** Skill lokale kontrolltidspunkter fra delte brukerdata, eller utelat bare slike uttrykkelig lokale felt fra konfliktsammenligningen. Bevar stabile ID-koblinger, kildefilens revisjon og reelle brukerendringer i konfliktgrunnlaget.

**Godkjenningskrav:** Lik rosterrevisjon på to enheter skal ikke kreve konfliktvalg bare på grunn av forskjellig hentetid. Samtidige nivå- og navneendringer skal fortsatt oppdages.

### F05 – ingen vei tilbake fra feil prosjektadresse

**Sted:** [SyncPanel.tsx, linje 49](src/SyncPanel.tsx#L49).

En syntaktisk gyldig, men feil prosjektadresse lagres før tilkoblingen er bekreftet. Etter «Koble til prosjekt» vises bare innlogging. Adresse- og nøkkelfeltene er borte, og det finnes ingen knapp for å endre prosjekt eller koble fra. Testen bekreftet null adressefelt og bare «Logg inn og synkroniser» i panelet.

**Forslag:** Vis gjeldende prosjekt og en knapp «Endre prosjekt / koble fra». Den må avslutte klienten og fjerne tilkoblingsinnstillinger uten å slette lag, spillere eller økter. Bekreft tilkoblingen før statusen sier at prosjektet er tilkoblet.

**Godkjenningskrav:** En feil adresse skal kunne rettes fra appen. Brukeren skal ikke måtte slette nettleserdata for å komme videre.

### F06 – automatisk synkronisering respekterer ikke avslått valg etter omstart

**Sted:** [SyncPanel.tsx, linje 12–16](src/SyncPanel.tsx#L12).

Testen logget inn mot en simulert tjeneste, fjernet avkrysningen for «Synkroniser automatisk» og lastet appen på nytt. Avkrysningen var da slått på igjen. Innstillingen lagres ikke, og autentiseringshendelser setter den til `Boolean(session)`.

**Forslag:** Lagre brukerens valg separat fra innloggingsstatus. En gjenopprettet innlogging eller tokenfornyelse skal ikke endre dette valget. Skill gjerne manuell «Synkroniser nå» fra automatisk synkronisering, slik at manuell kontroll fortsatt er mulig når automatikk er av.

**Godkjenningskrav:** Avslått automatikk skal forbli av gjennom ny lasting, bakgrunn/forgrunn og tokenfornyelse. Testen bekreftet tilbakestilt avkrysning; den målte ikke en faktisk opplasting til en ekstern konto.

### F07 – diagrameditor mangler tastaturvei for nye symboler

**Sted:** [Court.tsx, linje 35](src/Court.tsx#L35), [Court.tsx, linje 129](src/Court.tsx#L129).

Nye symboler og pilpunkter plasseres gjennom klikk/peker på SVG-banen. Banen er presentert som et bilde, uten tilsvarende tastaturhandling for plassering. Eksisterende elementer kan velges og få koordinater endret gjennom skjemaet, men en ny figur kan ikke opprettes på en tom bane med bare tastatur.

**Forslag:** Legg til «Legg til valgt symbol» med startposisjon midt på banen og tilgjengelige X/Y-felt. Gi piler tilsvarende start- og sluttpunktkontroller. Alternativt må banen få tydelig tastaturstyring og fokusmarkering. Dette funnet er basert på kodegjennomgang, ikke en full skjermleserrevisjon.

### S01 – sikkerhetsvarsel i utviklingsverktøy

`pnpm audit --prod --json` rapporterte **0 varsler**. Full `pnpm audit --json` rapporterte **1 high-varsel** for `picomatch@4.0.7`, trukket inn gjennom Vite, fdir og tinyglobby. Dette gjelder mønsterbehandling i Node-verktøyene, ikke en påvist angrepsvei gjennom spillerimporten eller den statiske Pages-appen.

Den kontrollerte sikkerhetsmeldingen oppgir berørte versjoner til og med 4.0.7 og ingen oppført rettet versjon per kontrolltidspunktet. [GitHub Advisory GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).

**Forslag:** Følg opp den transitive avhengigheten og en dokumentert rettet versjon når den finnes. Vurder eksponering for eksternt styrte glob-mønstre i utvikling/CI. Ikke foreta en blind pakkeoppgradering eller automatisk «audit fix» uten å kontrollere kompatibilitet og om varselet faktisk er løst.

## Øvrige forbedringsforslag

| Forslag | Hvorfor | Anbefalt tidspunkt |
| --- | --- | --- |
| Samme kvalitetskrav før enhver Pages-publisering | Pages-jobben kjører enhetstester og bygg, men ikke nettleser-/mobiltestene. Direkte endring på `main` kan publiseres uten disse testene; branch protection ble ikke kontrollert. | Neste rettingsrunde |
| Valider den faktiske `public/rosters.json` under bygg/CI | Dagens parser beskytter lokale data, men ugyldig offentlig JSON kan likevel bli publisert og gi importfeil på telefonen. | Neste rettingsrunde |
| Bevar eller varsle om ulagrede diagram- og metadataendringer | Disse redigeringene ligger i komponenttilstand til brukeren trykker Lagre. Navigasjon og bytte av diagramtrinn bør ikke kunne forkaste arbeid uten tydelig beskjed. | Etter datarettingene |
| Vis fullstendig aktivt lagnavn utenfor rullegardinlisten | Lange navn kuttes visuelt i smale felt, særlig ved stor tekst. | Neste mobilforbedring |
| Skill aktive spillere fra historisk importerte ID-er | Importoversikten teller også tidligere koblede ID-er. Vis gjerne antall per lag og hvor mange som fortsatt finnes i kildefilen. | Neste brukerflateforbedring |
| Gjør importvalgene enklere å kontrollere før lagring | Vis en oppsummering av koblinger og navnevalg, og la brukeren endre et valg før «Bruk avklarte valg». | Neste importforbedring |
| Del opp store komponenter og tettpakkede kodelinjer | Lagring, oppmøte, Plan B og synkronisering blir lettere å teste og gjennomgå. | Gradvis sammen med rettinger |
| Vurder utsatt lasting av Supabase-klienten | Synkroniseringspakken er omtrent 229 kB ukomprimert / 60 kB gzip, selv for dem som bare bruker lokal app. Dette er et optimaliseringsforslag, ikke en målt treghetsfeil. | Etter funksjonsrettinger |
| Trenervurder de gjenstående illustrasjonene | Diagramrapporten har seks «Til trenergjennomgang» og én «Trenger avklaring». Teknisk SVG-test er ikke håndballfaglig godkjenning. | Før de omtales som faglig ferdigkontrollerte |

## Gjennomført kontroll og dekning

| Område | Kontroll og resultat |
| --- | --- |
| Bygg og versjon | `pnpm build` bestått; appkode og `dist/version.json` viser 3.0.1 |
| Enhetstester | 48 av 48 bestått i ny kjøring |
| Hjem, bank, detalj, søk, filter og favoritter | Kodegjennomgang, eksisterende funksjonstester og mobilmatrise; ingen ny bekreftet feil i disse kjernedelene |
| Planlegging, lagrede økter, kopier og maler | Eksisterende tester bestått; ekstra samspilltest avdekket F03 |
| Lag, spillere, oppmøte og lagdeling | Eksisterende tester bestått; ekstra importtest avdekket F02 |
| Backup, migrering, lagring og flere faner | Eksisterende tester bestått; ekstra ugyldig-data-test avdekket F01 |
| GitHub-import | 15 → 16, ingen dubletter, lokale nivåer, historikk, feilaktig JSON og offline bestått; samspillfunn F02/F04 |
| Hallmodus, timer og Plan B | Eksisterende nettleser-/enhetstester bestått, også gjenoppretting og offline |
| Diagrammer og editor | 122 hovedøvelser og diagramtrinn renderes uten avkuttede symboler; redigering, touch, angre/gjør om bestått; tastaturmangel F07 |
| Teksteksport | Kopiering, nedlasting, varianttekst og share-fallback dekket av eksisterende tester; ingen ny bekreftet feil |
| Ukeplan og standardinnstillinger | Kodegjennomgang og eksisterende tester bestått |
| Supabase-klient | Simulerte to-enhetstester bestått; ekstra tester avdekket F04, F05 og F06 |
| PWA og oppdatering | Ekte service-worker-oppdatering med nye JS/CSS-adresser bestått; data bevart og ny versjon tilgjengelig offline |
| Mobilgeometri | 320, 360, 390, 412, 768 og 1280 px i lys visning bestått |
| Mørkt og stor tekst | Mørk visning og 200 % tekst ved 320/390 px, tvungen mørk ved 390 px bestått |
| Visuelle skjermbilder | Tidligere gjennomgåtte bilder fra samme 3.0.1-appkode er dokumentert i [leveranserapporten](RAPPORT-3.0.1.md); mobilmatrisen er kjørt på nytt |
| Avhengigheter | Ingen produksjonsvarsler; ett varsel i utviklingsavhengigheter, S01 |
| Kildebank | Ingen endringer i `src/bank.json` under kontrollen |

De grønne testene dekker de scenariene de faktisk kjører. De nye feilene viser hvorfor grønne tester alene ikke er tilstrekkelig godkjenning av samspill mellom funksjoner.

Råresultater for F01–F05 ligger i [funnfilen](docs/kvalitet-3.0.1-funn.json). Lokale reproduksjonsskript er `qa/audit301.mjs` og `qa/audit-sync-preference.mjs`. De bruker syntetiske data i separate nettleserprofiler, og er diagnostikk for de registrerte feilene, ikke regresjonstester som skal kreve at feilene forblir.

## Publiseringsstatus

[GitHub Pages](https://levemannen.github.io/H-NDBALLTRENER-N/) ble lest under kontrollen. Både `version.json` og appens synlige versjon viste **3.0.0**. Lokal versjon er **3.0.1**. Dette er et bekreftet versjonsavvik mellom publisert og lokal utgave, ikke en feil i den lokale versjonsvariabelen. 3.0.1-grenen er ikke publisert gjennom denne gjennomgangen.

## Gjenstående verifikasjon

Fysisk Samsung-telefon, Samsung Internet/Firefox, Android-installasjon, operativsystemets tekstinnstillinger og skjermleser er ikke kontrollert på faktisk maskinvare. Chromium-mobilvisning og tvungen mørk simulering erstatter ikke disse testene. Ingen live Supabase-konto eller live RLS-policy er testet; SQL-oppsettet er lest og klienten er testet mot simulert tjeneste. Ingen full ytelsesprofilering, penetrasjonstest eller uavhengig håndballfaglig gjennomgang er utført.

## Foreslått rettingsrekkefølge

1. Rett F03 og F01, og legg til regresjonstester som forventer bevart oppmøte og avvist ugyldig backup.
2. Rett F02, F04, F05 og F06. Test særlig samspill mellom import, oppmøte og synkronisering.
3. Rett F07, styrk publiseringskontrollene og avklar S01.
4. Gjennomfør en fysisk Samsung-test med eksisterende data før innfletting og publisering. Kontroller etterpå både Pages-versjonsfil og synlig appversjon.

Hvis dette klargjøres som en ny separat feilrettingsutgivelse, er 3.0.2 et naturlig versjonsnummer. Versjonen er fortsatt 3.0.1 i denne runden, siden ingen apprettinger er utført.
