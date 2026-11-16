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

`src/bank.json` inneholder 122 nummererte hovedøvelser fra Master v3, samt partnerbanken, kjernebanken, målvakttillegget og listen over uavklarte øvelser. Seksjonene beholder tekst og rekkefølge fra kilden. Kategorifiltrene bruker kategorioversikten, og ferdighetstaggene er hentet ut fra «Hva trener vi?». Vanskelighetsgrad settes som en egen opplysning. Illustrasjonen til øvelse 16 viser varianten med fem spillere og seks kjegler.

Importer kilden på nytt med `./scripts/Read-Bank.ps1 -Document 'sti-til-kilden.docx'` i PowerShell. Se gjennom endringer i øvelses-ID-er før publisering, siden treningsplaner og notater refererer til disse.

## Brukerdata og sikkerhetskopi

Spillerliste, notater, favoritter, illustrasjoner og lagrede økter ligger lokalt i nettleseren. Bruk **Mitt lag → Sikkerhetskopi** for å flytte data mellom nettlesere eller enheter. Import validerer formatet og ber om bekreftelse før lokale data erstattes. Oppbevar sikkerhetskopier privat.
