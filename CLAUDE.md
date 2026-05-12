# BiteCheck PWA

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

**Torsk og Steinbit har to varianter** — `method: 'land' | 'båt'` i `SPECIES_DEFS`. Tanken er at SST (sjøtemperatur) påvirker kystfiske fra land men ikke dypvannsfiske fra båt. Land-varianter bruker `water_temp` i scoringsformelen; båt-varianter bruker månefase/tidevann.

## Nøkkelfiler
- `src/lib/biteScore.ts` — all scoringslogikk + `SPECIES_DEFS` (enkelt sannhetskilde for alle arter). Eksporterer `SPECIES_WATER` map.
- `src/lib/db.ts` — IndexedDB-wrapper med pub/sub for live-oppdateringer
- `src/hooks/useWeather.ts` — parallelle kall til open-meteo vær-API + marint SST-API
- `src/hooks/useTide.ts` — Kartverket vannstand-API → `TidePhase` + `CurrentStrength`
- `src/hooks/usePublicCatches.ts` — Firestore-query med `where('user_id', '!=', ...)` (krever ingen eksplisitt komposittindeks — dekkes av Firestores auto-indekser)
- `src/lib/speciesInfo.ts` — norsk fiskeinfo for alle arter (brukes i `SpeciesSheet`)

## UI-språk
Hele appen er på norsk. Fortsett med norske labels, knapper og meldinger.
