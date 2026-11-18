# Rettelser etter kvalitetssjekken – 3.0.2

18. november 2026. Arbeidsgren: `codex/handballtrener-3-0-2`.

De sju appfunnene F01–F07 fra [kvalitetsrapporten](KVALITETSRAPPORT-3.0.1.md) er rettet. Sikkerhetsvarselet S01 i utviklingsavhengigheten picomatch er fortsatt åpent; det er ikke oppgitt noen publisert rettet versjon.

| Funn | Rettelse | Kontroll |
| --- | --- | --- |
| F01 – ugyldig backup gir tom side | Hvert lags regler valideres før lagring/import. Uleselige data beholdes og gir tilbud om redningskopi. En generell feilvisning beskytter også mot tom side ved andre renderfeil. | Ugyldige objekter, tekst og negative lagnumre avvist; eksisterende ugyldige data beholdt med synlig redningskopiknapp |
| F02 – ny spiller mangler i alle-utvalget | Alle-modus avledes fra oppdatert spillerliste; manuelle utvalg og historisk oppmøte beholdes. | Import fra 15 til 16 gir 16 valgte |
| F03 – utkast overskriver nyere oppmøte | Redigering av lagret økt tar vare på sammenligningsgrunnlaget i utkastet. Ved lagring bevares nyere felt som utkastet ikke har endret. Oppmøte og lagfordeling behandles samlet. Reelle konflikter krever bekreftelse og eksporterer sikkerhetskopi før erstatning. | Nytt oppmøte, fordeling og evaluering beholdes. Avbrutt konfliktvalg beholder begge versjoner. Eldre utkast uten grunnlag og slettede økter krever avklaring. |
| F04 – hentetid gir falsk skykonflikt | Enhetens importtidspunkt utelates fra den semantiske konfliktsammenligningen. Selve payloaden og importhistorikken beholdes. | Samme import på to tidspunkt gir ingen konflikt; samtidige nivåendringer gir fortsatt konflikt |
| F05 – feil prosjekt kan ikke rettes | «Endre prosjekt / koble fra» åpner innstillingene igjen uten å slette lag og spillere. Status skiller lagret adresse fra bekreftet innlogging. | Adressefeltene kommer tilbake; spillere og lagrede økter er uendret |
| F06 – avslått automatikk slås på igjen | Automatikkvalget lagres separat fra innloggingsstatus. Manuell synkronisering virker også når automatikk er av. | Etter ny lasting er automatikk fortsatt av, ingen automatisk opplasting skjer i testen, manuell synkronisering virker |
| F07 – diagrammer krever peker | Knapper legger til symbol midt på banen og pil med start-/sluttpunkt. Koordinatene kan redigeres med tastaturet. | Symbol og pil opprettet med Enter og lagret gjennom brukergrensesnittet |

## Publiseringskontroller

- `pnpm build` kontrollerer nå den faktiske `public/rosters.json` før TypeScript og Vite kjøres. Ugyldig spillerfil stopper byggingen.
- Pages-jobben kjører nå også hele nettlesertesten og mobilmatrisen før opplasting og publisering. Dette gjelder også direkte endringer på `main`.
- Sjekkjobben dekker alle `codex/**`-grener.
- Versjonen er 3.0.2 i `package.json`. Bygget bekrefter samsvar mellom appkode og `dist/version.json`. Øvelsesbanken er uendret.

## Testresultater

- 53 av 53 enhetstester bestått.
- Produksjonsbygg og versjonskontroll bestått.
- Full `pnpm test:browser` bestått: eksisterende funksjonstester, migrering, backup, offline, PWA med nye JS/CSS-adresser, 122 diagrammer, simulert synkronisering, spillerimport og de nye regresjonstestene.
- Full `pnpm test:mobile` bestått: lys visning ved 320, 360, 390, 412, 768 og 1280 px; mørk visning og 200 % tekst ved 320/390 px; tvungen mørk visning ved 390 px.
- Etter siste justering av de norske konfliktnavnene ble produksjonsbygget og de berørte enhets-/nettlesertestene kjørt på nytt og bestod.

Nye tester: `tests/fixes302.test.mjs`, `tests/browser-fixes302.mjs` og `tests/browser-sync-preference.mjs`. Testene bruker syntetiske data og egne nettleserprofiler, ikke trenerens eksisterende lokale data.

## Gjenstående forhold

**S01 er ikke løst.** Både npm-registeret og sikkerhetsmeldingen ble kontrollert: siste publiserte picomatch-versjon er 4.0.7, og meldingen oppgir ingen rettet versjon. Det er derfor ikke gjort en udokumentert oppgradering eller skjult varselet. Avhengigheten ligger i Vite-verktøykjeden; ingen angrepsvei gjennom den publiserte statiske appen er påvist i gjennomgangen. [Sikkerhetsmelding GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).

Fysisk Samsung-test, faktisk Android-installasjon og live Supabase/RLS er fortsatt ikke utført. De øvrige, valgfrie produktforslagene i kvalitetsrapporten – blant annet ytterligere forenkling av importoversikten, utsatt lasting av synkroniseringspakken og faglig trenergjennomgang av illustrasjoner – inngår ikke i disse feilrettingene.

GitHub Pages er ikke publisert eller bekreftet oppdatert av denne utgivelsesrapporten. Etter innfletting og bestått publisering må både nettets `version.json` og appens synlige versjon kontrolleres. En eldre åpen app laster det nye bygget med «Oppdater nå».
