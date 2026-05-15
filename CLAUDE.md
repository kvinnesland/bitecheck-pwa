# BiteCheck PWA

> **For Claude:** Hold denne filen oppdatert løpende. Når en issue løses, stryk den fra listen. Når nye bugs eller beslutninger dukker opp i samtalen, legg dem til. Commit endringer i `CLAUDE.md` sammen med relevant kode.


Norsk fiske-PWA som predikerer bitesjanse per art basert på miljøforhold.

## Tech stack
- React + TypeScript + Vite + VitePWA (`registerType: 'prompt'`)
- Firebase: Firestore (fangstlogg), Auth (Google login), Hosting
- IndexedDB via `idb` for offline-first fangstlagring
- MapLibre GL for kart
- SunCalc for solunar-/månekalkuleringer
- open-meteo API: vær (luft, trykk, vind) + marint API (SST)
- Kartverket vannstand-API for tidevann
- Nominatim/OSM for geokoding

## Deployment
```
npm run build
firebase deploy --only hosting
git push
```
Ingen CI/CD — alt deployes manuelt. Firebase-prosjekt: `fishing-projects`. URL: https://fishing-projects.web.app

## Viktige valg og begrensninger

**Firebase Storage er ikke satt opp** — prosjektet er på Spark-plan og regionen støtter ikke gratis buckets. Fotofunksjonen ble fjernet fullstendig. Ikke prøv å legge den tilbake uten å oppgradere til Blaze-plan.

**Firestore privacy-regler er bevisst svake** — `allow read: if request.auth != null` betyr alle innloggede brukere kan lese alle fangster. Dette er en kjent issue som er utsatt fordi det krever en større design-beslutning om privat vs. offentlig data.

**Torsk og Steinbit har to varianter** — `method: 'land' | 'båt'` i `SPECIES_DEFS`. Tanken er at SST påvirker kystfiske fra land men ikke dypvannsfiske fra båt. Land-varianter bruker `water_temp` i scoringsformelen; båt-varianter bruker månefase/tidevann. **Ingen andre arter splittes** — de øvrige er enten primært én metode, eller overflatepelagiske der dybdeforskjell ikke gir ulikt scoring-signal.

**Torsk/Steinbit trenger ikke egne SpeciesSheet-sider** — de er samme fisk, infokortene er identiske uavhengig av land/båt-varianten.

**Tidevann og strøm skjules for ferskvann** — kontrollene i BiteScore vises kun når `waterFilter === 'salt'`. `useTide` returnerer tom data for ferskvann.

**Score-kurven bruker timedata** — `useWeather` returnerer nå `hourlyWeather[]` (24 entries) slik at kurven bruker riktig trykk/temp/vind per time i stedet for én fast verdi. Dette gir realistisk variasjon gjennom dagen.

**Kartlag (gratis WMS/tiles):**
- Dybde: Geonorge WMS
- Bunn: NGU WMS
- Sjømerker: OpenSeaMap XYZ tiles
- Verneområder: Miljødirektoratet WMS (`naturvern_omrade`) — dekker sjø og ferskvann
- Gyteområder: Fiskeridirektoratet WMS (`gyteomraader`) — sjø, sesongrestriksjoner
- Ingen dedikert "fiskeforbudt"-lag finnes nasjonalt — verneområder + gyteområder er beste tilnærming

**Bundle-størrelse** — produksjonsbuilden er ~1,7 MB (482 KB gzipped). Vite advarer om chunk-størrelse. Ikke kritisk, men code-splitting med dynamic `import()` bør vurderes på sikt.

## Nøkkelfiler
- `src/lib/biteScore.ts` — all scoringslogikk + `SPECIES_DEFS` (enkelt sannhetskilde for alle arter). Eksporterer `SPECIES_WATER` map.
- `src/lib/db.ts` — IndexedDB-wrapper med pub/sub for live-oppdateringer
- `src/lib/speciesInfo.ts` — norsk fiskeinfo for alle arter inkl. `season`-felt (brukes i `SpeciesSheet`)
- `src/hooks/useWeather.ts` — parallelle kall til open-meteo vær-API + marint SST-API. Returnerer både enkeltverdi (nåværende time) og `hourlyWeather[]` (hele dagen)
- `src/hooks/useTide.ts` — Kartverket vannstand-API → `TidePhase` + `CurrentStrength`. Returnerer tom data for `waterType === 'fresh'`
- `src/hooks/usePublicCatches.ts` — Firestore-query med `where('user_id', '!=', ...)` (krever ingen eksplisitt komposittindeks — dekkes av Firestores auto-indekser)
- `src/components/DailyScoreChart.tsx` — daglig scorekurve. Bruker `hourlyWeather[]` per time. Viser ikke "nå"-kursoren for fremtidige datoer.
- `src/pages/Kart.tsx` — kartside med 5 togglebare lag

## UI-språk og i18n
Appen migreres til internasjonalisering (i18next + react-i18next). **Engelsk er default locale og kildespr åk i koden.** Norsk (nb) er en full oversettelse. Ikke legg til hardkodede norske strings — bruk `t('key')` og legg oversettelser i `public/locales/en/translation.json` og `public/locales/nb/translation.json`. Eksisterende norske strings skal ekstraheres som del av i18n-migreringen.

## Design
Full redesign pågår. Komponentbibliotek: **shadcn/ui + Tailwind**. Alle eksisterende `.module.css`-filer skal erstattes. Design tokens (farger, spacing, typografi) mappes fra `global.css` CSS-variabler til `tailwind.config.ts`. Ikke introduser nye CSS Module-komponenter — skriv nye komponenter med Tailwind-klasser og shadcn/ui som base.

## Kodestandarder

### Separasjon av ansvar
Følg dette mønsteret konsekvent — det er prosjektets ekvivalent til en tre-lags arkitektur:

- **`src/lib/`** — rene funksjoner uten React, uten side effects. Konverteringer, scoringslogikk, storage-helpers. Kan testes isolert.
- **`src/hooks/`** — datahenting, subscriptions, avledet state. Kaller lib-funksjoner og ekstern state. Ingen JSX.
- **`src/pages/` + `src/components/`** — UI-lag. Kaller hooks og lib. Ingen direkte Firestore-kall eller fetch-logikk.

Aldri kall Firestore direkte fra en komponent — legg det i en hook eller `lib/db.ts`.

### TypeScript
- Unngå `any` og `unknown`. Spør om nødvendig type er uklar.
- Bruk typer fra npm-pakker fremfor egne ekvivalenter der de finnes.
- Typer som brukes på tvers av lag legges i `src/types.ts`.

### Avhengigheter
- Ikke legg til nye npm-pakker uten å spørre først.
- Begrunn behovet — foretrekk innebygde browser-API-er eller eksisterende pakker.

### Kommentarer
- Bare kommenter *hvorfor*, ikke *hva*. Koden selv dokumenterer hva.
- Ingen kommentarer for åpenbare ting. En god funksjonsnavn er bedre enn en kommentar.

### Ferdighetskriterier
- `tsc -b` og `npm run build` skal passere uten feil før en oppgave er ferdig.
- Ingen ubrukte importer eller variabler.

---

## Change-impact sjekkliste
Når en feature berører noen av disse, verifiser det eksplisitt:

| Hva endres | Hva må sjekkes |
|---|---|
| Visningstekst / labels | Begge locale-filer (`en` + `nb`) |
| Måleenheter (vekt, lengde, temp) | Alle steder som viser eller lagrer verdien (`lib/units.ts`, Historikk, LoggFangst, BiteScore, SpeciesSheet, Kart) |
| Firestore-feltnavn | Feltnavn er permanente nøkler — endre aldri eksisterende felt uten migreringsplan |
| Ny art eller nytt artsnavn | `SPECIES_DEFS` (biteScore.ts), `KNOWN_SPECIES` (speciesInfo.ts), begge locale-filer (`speciesNames.*`) |
| Ny side / navigasjon | `AppView` type i BottomNav, switch-case i App.tsx |
| localStorage-nøkler | Ikke endre eksisterende nøkkelnavn — det bryter lagret brukerdata |

---

## Åpne issues / TODO

### Utsatt (bevisst)
- **Firestore privacy-regler** — `allow read: if request.auth != null` betyr alle innloggede brukere kan lese alle fangster. Krever design-beslutning: hva skal være privat vs. offentlig? Relevant når brukerbase vokser.
- **Bilder på turer** — krever Firebase Blaze-plan + Storage. Bevisst ekskludert fra v1. Se SOCIAL_PRD.md Todo.

### Ideer ikke startet
- Legg til flere ferskvannsarter (abbor er geografisk begrenset til Østlandet, vurder brasme, lake, suter)
- Push-varslinger når solunarperiode starter (krever Notification API + service worker-integrasjon)
- Code-splitting av bundle (1,7 MB → dynamisk import av tunge libs som MapLibre, SunCalc)
- Kartside: vurder å vise bitesjanse-heatmap for brukerens posisjon direkte på kartet
