# Håndballtrener’n

Mobiltilpasset trenerapp for Vålerenga G2016/17 med øvelsesbank, øktplanlegging, hallmodus og lagdeling. Appen bruker React, TypeScript og Vite.

## Lokal kjøring

Bruk Node.js 24 og pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
pnpm preview
```

Åpne adressen terminalen viser. Bruk produksjonsbygget via `pnpm preview` for å teste offline. Åpne appen én gang på nett og vent til service worker er aktiv før du kobler fra. Installer appen fra nettlesermenyen der funksjonen er tilgjengelig.

## Publisering på GitHub Pages

Last opp prosjektet til grenen `main` i ønsket GitHub-repository. Velg **Settings → Pages → Build and deployment → Source → GitHub Actions**. Kjør **Publiser på GitHub Pages** fra fanen **Actions**, eller push en endring til `main`. Workflowen tester, bygger og publiserer `dist`. Publisert adresse vises på deployjobben. Relative ressursstier og hash-navigasjon gjør at samme bygg støtter både et repository-prefiks og rotadressen.

Se [GitHubs veiledning om publiseringskilder](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Øvelsesbanken

`src/bank.json` inneholder 122 nummererte hovedøvelser fra Master v3, samt partnerbanken, kjernebanken, målvakttillegget og listen over uavklarte øvelser. Seksjonene beholder tekst og rekkefølge fra kilden. Søk bruker både originaltekst og redaksjonelle ferdighetstagger og øvelsestyper fra `src/catalog.ts`. Søk etter spillerantall og hall krever samsvar med kjente metadata. Vanskelighetsgrad og oppgitt antall trenere kan settes som egne opplysninger.

Øvelse 16 viser startposisjonene og hvordan den tomme kjegla flytter seg etter pasning og løp. Øvelse 20, 22, 66 og 72 har kildekontrollerte SVG-skisser. Bruk egne metadata eller dupliser en øvelse for å tilpasse den. Egne opplysninger og illustrasjoner lagres i brukerdata, sammen med eksisterende spillerliste og treningsøkter.

Importer kilden på nytt med `./scripts/Read-Bank.ps1 -Document 'sti-til-kilden.docx'` i PowerShell. Se gjennom endringer i øvelses-ID-er før publisering, siden treningsplaner og notater refererer til disse.

## Brukerdata og sikkerhetskopi

Spillerliste, notater, favoritter, illustrasjoner og lagrede økter ligger lokalt i nettleseren. Bruk **Mitt lag → Sikkerhetskopi** for å flytte data mellom nettlesere eller enheter. Import validerer formatet og ber om bekreftelse før lokale data erstattes. Oppbevar sikkerhetskopier privat.

## Videre forbedringer

Treningsplanen viser ledige minutter og eventuell overskridelse. Øvelser kan åpnes fra planen. Mine treninger kan filtreres på kommende og tidligere økter, og spillerlisten har søk og sortering på navn eller nivå.

Halltimeren husker øvelse, pausetid og sluttidspunkt i samme nettleserfane, også etter navigasjon og ny innlasting. Tiden beregnes fra klokkeslett. Nettleseren kan begrense aktivitet i bakgrunnen. Timerstatus er midlertidig og inngår ikke i sikkerhetskopien.

Fortsatt arbeid fra den komplette 2.0-bestillingen omfatter lagrede lagfordelinger med navn og bytting, evalueringer, startklokkeslett, delvis gjenbruk av økter, forslag basert på nivå og utstyr, flere treningsgrupper og en tydelig oppdateringsknapp. GitHub Actions-versjoner og publisering må også verifiseres på GitHub.

Treninger støtter nå valgfri starttid, klokkeslett per øvelse, gjenbruk av enkeltøvelser fra lagrede planer og kort evaluering. Under Mitt lag kan lag få navn og lagres med oppmøte på valgt trening. Nye felt er valgfrie i det eksisterende lagringsformatet. Import avviser dupliserte spillere i lagfordeling og ugyldig starttid.
