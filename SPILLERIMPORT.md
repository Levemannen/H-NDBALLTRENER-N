# Spillerlister fra GitHub

Appen henter `public/rosters.json` fra samme GitHub Pages-adresse som appen. Filen inneholder nå de 19 godkjente spillerne i Vålerenga G2016/17, med navn og nivåer per 18. november 2026.

**GitHub-filen er offentlig, også når bare du bruker appen.** Etter uttrykkelig godkjenning publiseres også nivåer for denne spillerlisten. Feltet `level` er valgfritt og må være et tall fra 1 til 4. Oppmøte og private kommentarer skal fortsatt lagres lokalt eller i den eksisterende private Supabase-synkroniseringen. Ikke legg en eksportert sikkerhetskopi i repositoryet.

## Slik legger du inn spillere på PC

1. Åpne [spillerfilen på GitHub](https://github.com/Levemannen/H-NDBALLTRENER-N/blob/main/public/rosters.json). Funksjonen må først være flettet inn i `main`.
2. Trykk blyanten **Edit this file**.
3. Bruk strukturen i [eksempelfilen](docs/rosters.example.json). Eksempelfilen inneholder tydelig merkede syntetiske navn; bytt dem ut før bruk. Den blir ikke publisert som appens spillerliste.
4. Gi hvert lag en fast ID, for eksempel `vif-g2016-17` eller `vif-j2011`. Gi hver spiller en unik ID i hele filen, for eksempel `vif-player-001`. Bruk bokstaver uten æ/ø/å, tall og bindestrek i ID-er. Norske tegn er tillatt i navn.
5. Behold ID-ene når navn endres. En ny spiller får en ny ID som aldri har vært brukt av noen annen. Ikke flytt eksisterende ID-er mellom lag i denne filen.
6. Øk `revision` med 1 ved hver endring og oppdater `updatedAt`, for eksempel `2026-11-17T18:00:00Z`. La `schemaVersion` være `1`.
7. Trykk **Commit changes**. Hvis GitHub oppretter en egen gren, må endringen flettes inn i `main` før publisering.
8. Vent til GitHub Actions-jobben for Pages er grønn. JSON må ha doble anførselstegn og komma mellom elementene, men ikke etter det siste elementet.

Du kan ha flere lag i `teams`. Hvert lag har sin egen `players`-liste. Du trenger ikke endre appversjonen for bare å oppdatere spillerfilen; filens `revision` er separat fra appversjonen.

## På telefonen

Åpne den oppdaterte appen med internett. Den sjekker filen ved oppstart, når den kommer tilbake i forgrunnen, og når nettet kommer tilbake. Under **Mitt lag → Spillerliste fra GitHub** kan du også trykke **Hent spillerliste fra GitHub**. Her vises status, tidspunkt, revisjon og antall koblede/importerte spiller-ID-er på tvers av lag. Spillere som senere er fjernet fra filen, inngår fortsatt i dette antallet.

Det aktive laget vises øverst. Bytt lag der for å se spillere i et annet lag. Første import til en tom app velger automatisk det første importerte laget med spillere. Nye spillere får nivået fra filen, eller standardnivå 4 hvis `level` mangler.

Når det allerede finnes et lag/spillere med samme navn, spør appen om de skal kobles sammen. Velg eksisterende spiller for å beholde ID, nivå og historikk. Navn alene brukes ikke som varig identitet. Ved motstridende lokale og eksterne navn spør appen hvilket navn du vil beholde. Ingen del av importen lagres før nødvendige valg er avklart.

Ny import lager ikke dubletter for samme ID. Eksisterende nivåer endres bare etter et uttrykkelig importvalg. Oppmøte, lagfordeling, økter og kommentarer beholdes. Hvis et navn tidligere var forkortet, velg riktig eksisterende spiller når importen spør; da beholdes ID og historikk og navnet oppdateres til fullt navn. Spillere som forsvinner fra GitHub-filen slettes ikke lokalt. Lokal sletting og flytting mellom lag krever særskilt avklaring; filen er ikke et verktøy for automatisk flytting av historikk.

Uten internett beholder appen sist importerte data. Ugyldige filer eller eldre revisjoner avvises uten å erstatte lokale data. Endring uten høyere `revision` avvises også. Spillerfilen hentes fra nettet uten service-worker-cache; offlinekopien er den validerte lokale appdatabasen.

Ved ny **appversjon** bruker du **Oppdater nå** når den vises. Dette laster også nye CSS-filer. Appoppdateringer og spillerimport bevarer lokale data. Ikke slett nettleserdata eller avinstaller med sletting av data for å oppdatere.
