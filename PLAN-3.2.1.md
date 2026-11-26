# Arbeidsplan 3.2.1

Arbeid lokalt i eksisterende app. Ingen commit, push eller publisering. Versjon beholdes på 3.2.0 til sluttkontrollen er ferdig.

1. Referansekjøring av installasjon, 77 enhetstester, bygg, nettlesertester og mobiltester. Gjennomgang av tidligere rapporter og faktisk kode.
2. P0: avgrensede endringsoperasjoner med konfliktkontroll; navngitt oppmøte bevares; funksjonelle oppdateringer bruker siste tilstand. Presise gjennomføringsforekomster, timer, historikk og evaluering med bakoverkompatibel validering.
3. P0/P1: aktive og utdaterte lagoppsett, balansert minimal endring, faste nivågrupper, manuelt bytte, forhåndsvisning og godkjenning.
4. P1: oppdaterte Plan B-rammer, femminuttersinnsetting, felles tid, varierte forslag, innsetting før/etter og samordnet øvelsesvelger. Mobilflyt og hallinnstillinger.
5. P2 etter P0/P1: kalenderavlysning, kamprekkefølge, filtervalg og sikring av illustrasjoner når forsvarlig.
6. Full ordinær testkjøring etter siste kodeendring, realistisk nettleserflyt og visuell kontroll. Versjon 3.2.1, bygg/versjonskontroll og konkret rapport med testdekning og eventuelle restpunkter.

Bekreftede funn før retting: komplette Session-snapshots ved angre; Plan B nullstiller navngitt oppmøte; hvert pauseintervall avrundes ned; gjentatt hopp over siste lager flere poster; flere gjennomføringer deler post per itemId/exerciseId; evaluering bruker exerciseId; allocationId følges ikke i hall; lagoppsett flyttes til slutten ved endring; hallens tilpasningskontroller forblir aktive etter avslutning.
Status 26. november: Implementasjon og versjonsbygg er ferdig lokalt som 3.2.1. Rapport og endringslogg beskriver testdekning og begrensninger. Den valgfrie utvidelsen av sikring for ulagrede illustrasjonsutkast er utsatt; øvrige leverte endringer er implementert i eksisterende app.
