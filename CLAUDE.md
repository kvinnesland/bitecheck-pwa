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

**Firestore privacy-regler er bevisst svake** — `allow read: if request.auth != null` betyr alle innloggede brukere kan lese alle fangster. Design-beslutning tatt: synlighet styres på trip-nivå (`visibility: 'everyone' | 'followers' | 'only_me'`), ikke per fangst. Posisjonspresisjon (`locationShare`) styres per fangst med profilnivå-default. Se SOCIAL_PRD.md §4.7 og §7. Reglene implementeres som del av Vertical 1/3.

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

**Bundle-størrelse** — code-splitting implementert med `React.lazy`. Første last er ~230 KB gzipped (main bundle + logg-chunk). MapLibre (273 KB gz) lastes kun ved første besøk på Score- eller Kart-fanen. Eneste gjenværende store chunk er `maplibre-gl.js` (~1 MB / 273 KB gz) — kan ikke splittes videre.

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

### Gjort (sosiale vertikaler)
- **~~Vertical 1 — Identity~~** — UsernameModal, users/usernames-samlinger, profilside med redigering, privacy-innstillinger.
- **~~Vertical 2 — Social Graph~~** — Follow/unfollow, follow-request-flyt (pending → accept/deny), FollowListSheet, UserSearchSheet. Merk: followersCount/followingCount oppdateres IKKE client-side — dette håndteres av Cloud Functions som legges til i V5/V6.
- **~~Vertical 3 — Trip & Catch Layer~~** — Visibility-toggle (everyone/followers/only_me), isMultiDay-toggle, photoRefs-felt på CatchRecord, photo-placeholder-knapp med "krever Blaze"-melding, stale-state-fix for catchCount/species på activeTrip, fetchOpenTrip bruker nå Firestore-query i stedet for JS-filtrering.
- **~~Vertical 4 — Reactions & Comments~~** — Reaction bar (5 emoji, toggle, real-time via onSnapshot), comment thread med flat liste + input med @mention-autocomplete (fra following-list). Notification-writes client-side til `notifications/{uid}/items/`. Denormaliserte counts (reactionCounts, commentCount) på Trip-doc oppdateres av Cloud Functions (V5/V6). Firestore-regler for reactions/comments-subsamlinger og notifications.
- **~~Vertical 5 — Feed~~** — Following-based + discover pool (klient-side, ingen Cloud Functions). `feedRanking.ts` med freshness/engagement/seen-score. Seen-tracking via localStorage (`bc_seen_trips_{uid}`). Batch-oppslag av forfatter-profiler. Paginering (15 + "Load more"). TripCard viser reactions/comments-tall. Merk: fan-out Cloud Function (Blaze) deferred til etter plan-oppgradering.
- **~~Vertical 6 — Notifications~~** — `useNotifications` (onSnapshot, markRead, markAllRead). `Varsler.tsx`-side med varseliste, "Mark all read", push-permission-scaffold. Bell-ikon med rød badge i BottomNav (teller ulesede). AppShell abonnerer på unreadCount og sender det til BottomNav. Tap navigerer til riktig fane (dype lenker inn i nav-stack er utsatt til global nav-kontekst er på plass). AppView-type utvidet med `'varsler'`.

### Utsatt (bevisst)
- **Firestore privacy-regler (tripIsVisible-funksjon)** — data-modellen er klar (visibility-felt på Trip), men server-side enforcement utsettes til V5/feeds.
- **Bilder på turer** — krever Firebase Blaze-plan + Storage. Bevisst ekskludert fra v1. Se SOCIAL_PRD.md Todo.

### Bugs og designendringer
- **Overskriftsfont** — bytt til en mer klassisk font (serif eller slab-serif). Nåværende font er for moderne/teknisk for en fiske-app.
- **Kort ser komprimerte ut** — øk padding/spacing i kortkomponenter. Elementer sitter for tett.
- **Profilside stats-rad overflower** — rad med Catches/Species/Followers/Following er for bred, siste element kuttes av. Bruk flex-wrap eller reduser font-størrelse/padding så alle tallene får plass på én linje.
- **Profilside topp-arter viser duplikater** — Ørret dukker opp to ganger i Top Species-lista (to separate rader).
- **Profilside mangler tilbake-navigasjon** — ingen back-knapp. Løsning: enten gjør profil til et pull-down-kort (bottom sheet) eller legg til en tydelig tilbake-knapp øverst.
- **Varsler: ingen måte å slette leste varsler** — varsler blir liggende for alltid etter at de er lest. Legg til slette-funksjon (sveip for å slette enkeltvarsel, eller "Slett alle leste"-knapp).
- **Varsler skal ikke være egen bunnfane** — fjern Alerts-fanen fra BottomNav. Erstatt med bjelle-ikon i topp-headeren med rød badge for uleste. Tapp åpner varselside.
- **Topp-header skal reflektere biome** — headeren bør visuelt speile brukerens valgte biome (salt/ferskvann), f.eks. via fargetema eller bakgrunn.

### Ideer ikke startet
- **~~Profilside~~** — gjort. Avatar + navn, totalfangst, antall arter, personlig rekord, månedlig trendkurve, topp-arter.
- **Demo-profiler** — fiktive brukere med realistiske innlegg for å teste feed-design. Skal se ut og oppføre seg som ekte brukere (avatar, navn, innlegg, interaksjon). Trenger avklaring: Firestore write-regler, avatar-bilder (placeholder-service eller fargekodet initial), antall profiler og innlegg, Add/Remove-kontroll i Settings. Påbegynt implementasjon finnes i `src/lib/demoData.ts`, `src/lib/seedDemo.ts` og `SettingsSheet.tsx`.
- **Utstyrsliste (gear)** — mulighet til å logge hvilket utstyr som ble brukt per fangst (stang, sluk, agn, snøre). Åpne spørsmål: fri tekst vs. forhåndsdefinerte kategorier? Lagres i CatchRecord (nytt felt, krever migreringsstrategi) eller separat? Nyttig for å koble utstyr mot fangstresultat over tid.
- **Internasjonale arter** — artslisten er norsk-sentrisk. Utvid med internasjonalt relevante arter (bass, pike, carp, trout varieties, tuna, etc.). Vurder om SPECIES_DEFS bør regionsfilteres eller om alle arter alltid vises.
- Legg til flere ferskvannsarter (abbor er geografisk begrenset til Østlandet, vurder brasme, lake, suter)
- Push-varslinger når solunarperiode starter (krever Notification API + service worker-integrasjon)
- ~~Code-splitting av bundle~~ — gjort. React.lazy på alle sider.
- Kartside: vurder å vise bitesjanse-heatmap for brukerens posisjon direkte på kartet
