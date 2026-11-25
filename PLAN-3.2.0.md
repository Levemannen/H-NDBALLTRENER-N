# Arbeidsplan for 3.2.0

Arbeidet utføres lokalt. Ingen commit, push eller publisering utføres av agenten.

## Utgangspunkt

Eksisterende React/Vite-app beholdes. `Workspace` v3 skiller lag og delte øvelsesdata; `useWorkspace` håndterer skrivekontroll, backup og utkast. `Training.tsx` samler planlegger, historikk og hallmodus. Timeren ligger foreløpig i sessionStorage. Lagdelingen har allerede balansering og sammen/fra hverandre/lås-regler. Øvelsesvelger, søk, Plan B, illustrasjonstrinn, sesongplan, deling og PWA finnes og skal videreutvikles.

## Avhengigheter og rekkefølge

1. Kjør eksisterende tester som referanse. Utvid og valider valgfrie økt- og arbeidsområdefelt uten å omskrive gamle sikkerhetskopier. Legg til rene funksjoner for status, timer, planhistorikk og flere utkast.
2. Koble forside, utkast, planlegger og hall til samme økt. Lagre aktiv trening i eksisterende arbeidsområde, slik at offline, backup og synk følger samme vei.
3. Integrer oppmøte, flere lagoppsett, låsing og minimal endring direkte i trening. Behold eksisterende regelmotor og manuelle alternativer.
4. Forbedre tidslinje, låste øvelser, forslag, kontekst i velger, rådgivende kontroll, utstyr, Plan B og evaluering. Gjenbruk eksisterende metadata; ukjente krav skal merkes som ukjente.
5. Forbedre historikk, kalender og praktiske illustrasjoner. Test databevaring og arbeidsflyter i nettleser, inkludert offline og mobil.
6. Kjør regresjonskontroller og bygg. Sett package.json til 3.2.0 når implementeringen er kvalitetssikret. Dokumenter faktisk omfang og eventuelle rester i sluttrapporten.

Ingen gamle gjennomføringer skal få oppdiktede tidsmålinger. Original spillerfil, øvelsesbank, logo og autentiseringsarkitektur beholdes. Nye felter skal valideres ved lokal lagring, backup-import og synkronisering.

## Status 25. november 2026

Den prioriterte lokale leveransen er klargjort som 3.2.0. 77 enhetstester, samlet nettleserkontroll, mobilkontroll og produksjonsbygg er bestått. Implementert omfang, gjenstående detaljkrav og behov for fysisk mobilkontroll står i RAPPORT-3.2.0.md. Ingen publisering er utført.
