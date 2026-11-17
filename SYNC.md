# Privat synkronisering mellom PC og telefon

Synkronisering er valgfri. Appen fungerer lokalt uten konto. Ingen skytilkobling er aktivert av denne kodeleveransen.

## Oppsett

1. Opprett ditt eget prosjekt hos [Supabase](https://supabase.com/). Velg region og kontroller tjenestens vilkår og gjeldende plan for ditt bruk.
2. Åpne prosjektets SQL-editor. Kjør hele `supabase/schema.sql`. Den oppretter privat tabell, tilgangsregler og en lagringsfunksjon med revisjonskontroll.
3. Opprett din egen e-post/passord-bruker i prosjektets Authentication-del. Denne utgaven har innlogging; kontoadministrasjon og passordgjenoppretting gjøres i Supabase.
4. Finn prosjektets HTTPS-adresse og offentlige **publishable**-nøkkel (eventuelt eldre `anon`-nøkkel). Hemmelig nøkkel og `service_role` skal aldri inn i appen eller GitHub.
5. I håndballappen: åpne «Synkronisering», skriv adresse og offentlig nøkkel, velg «Koble til prosjekt» og logg inn. Dette starter automatisk synkronisering av alle lag og egne opplysninger.
6. Gjør det samme på telefonen med samme prosjekt og konto. Hvis telefonen allerede har lokale data, vises et valg mellom versjonene. Eksporter begge før du velger. Appen slår ikke sammen spillerlister automatisk.

Prosjektadresse og offentlig nøkkel lagres lokalt per enhet. Passordet fjernes fra feltets tilstand etter innloggingsforsøket. Supabase-klienten håndterer innloggingssesjon og fornyelse av token. Backup inneholder ikke token. Logg ut beholder lokale lag og treninger.

## Databevaring og tilgang

Transport bruker HTTPS. Tabellen bruker Row Level Security og knytter hver rad til innlogget `auth.uid()`. Anonyme brukere får ikke lese tabellen. Lagringsfunksjonen kjører som innlogget bruker med tom SQL-søkesti og eksplisitte skjemaer, etter prinsippene i Supabases dokumentasjon om [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) og [databasefunksjoner](https://supabase.com/docs/guides/database/functions).

Hele samlingen lagres som et validert workspace med formatversjon og revisjonsnummer. Databasen låser raden og avviser skriving basert på gammel revisjon. Klienten sammenligner lokal versjon, skyversjon og siste felles versjon. Når begge er endret, stopper automatisk synkronisering. Begge kan eksporteres før et eksplisitt valg. Valget gjelder hele samlingen av lag.

Offlineendringer lagres lokalt. Synkronisering prøves igjen ved tilbakevendende nett, forgrunn og med 30 sekunders intervall. Innlogging kan måtte fornyes ved gjenoppkobling. Feil overskriver ikke lokale data. Ukjente dataformatversjoner avvises.

## Kontroll før virkelige data

Klienttest mot simulert tjeneste bekrefter ikke tilgangskontrollen i ditt faktiske Supabase-prosjekt.

Bruk først et syntetisk testlag. Logg inn på PC og telefon og kontroller overføring begge veier. Slå av nett på telefonen, rediger samme syntetiske spiller begge steder, koble på igjen og kontroller at konflikt vises og begge versjoner beholdes.

Opprett en annen testkonto. Kontroller at den ikke kan lese første kontoens rad, heller ikke via direkte REST-forespørsel med første kontoens user_id-filter. Kontroller at bare offentlig nøkkel uten innlogging ikke gir spillerdata. Først etter dette kan faktisk synkronisering og tilgangskontroll regnes som verifisert.

Manuelt alternativ: Mitt lag → Eksporter, overfør filen privat, Mitt lag → Importer på den andre enheten. Backup er lesbar JSON og skal ikke legges i offentlig repository.
