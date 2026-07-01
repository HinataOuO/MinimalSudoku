# Baseline Release

---
id: refactor-play-store-baseline-release
status: done
updated: 2026-07-01
---

## Obiettivo
- [x] Fotografare stato release attuale prima di ogni refactor.

## Sotto-task
- [x] Rilevare comandi build/test disponibili.
- [x] Eseguire build release corrente, se ambiente pronto.
- [x] Annotare warning, dimensione APK/AAB e punti fragili.
- [x] Definire baseline minima per confronti successivi.

## Baseline 2026-07-01

### Comandi disponibili
- `npm test` -> `jest --cacheDirectory ./.jest-cache`
- `npm run typecheck` -> `tsc --noEmit`
- `npm run apk:demo` -> `cd android && NODE_ENV=production ./gradlew clean assembleRelease --no-daemon --max-workers=2 -PreactNativeArchitectures=arm64-v8a -PnewArchEnabled=true -PhermesEnabled=true -Pandroid.enableBundleCompression=true -Pandroid.enableProguardInReleaseBuilds=true -Pandroid.enableShrinkResourcesInReleaseBuilds=true -Pexpo.useLegacyPackaging=true && cd .. && node scripts/check-apk-size.mjs`

### Esito verifica
- `npm test`: PASS, 11 suite / 115 test.
- `npm run typecheck`: PASS.
- `npm run apk:demo`: PASS. APK release: 12.21 MB (limite 12.3 MB).
- `NODE_ENV=production ./gradlew bundleRelease --no-daemon --max-workers=2 -PreactNativeArchitectures=arm64-v8a -PnewArchEnabled=true -PhermesEnabled=true -Pandroid.enableBundleCompression=true -Pandroid.enableProguardInReleaseBuilds=true -Pandroid.enableShrinkResourcesInReleaseBuilds=true -Pexpo.useLegacyPackaging=true`: PASS da `android/`.

### Artefatti
- APK: `android/app/build/outputs/apk/release/app-release.apk` - 12,208,482 byte (12.21 MB).
- AAB: `android/app/build/outputs/bundle/release/app-release.aab` - 20,041,400 byte (20.04 MB).

### Firma release attuale
- `android/app/build.gradle` usa `signingConfig signingConfigs.debug` per `release`.
- Baseline tecnica valida per confronto dimensioni/build; non e Play Store production-signed.

### Warning principali
- Jest: `ExperimentalWarning: localStorage is not available because --localstorage-file was not provided.`
- Metro/Node: `NO_COLOR` ignorato per `FORCE_COLOR` durante bundling.
- Android manifests dipendenze: `package=` deprecato/ignorato in `@react-native-async-storage/async-storage` e `react-native-safe-area-context`; `expo-modules-core` segnala `meta-data#com.facebook.soloader.enabled` con `tools:replace` senza dichiarazione sostituita.
- Gradle/C++: `[CXX5304]` mismatch SDK XML version 4 vs tool che capisce fino a 3.
- Dipendenze native: vari warning Kotlin/Java deprecated/unchecked in `react-native-screens`, `react-native-safe-area-context`, `expo`, `expo-modules-core`, `react-native-svg`.
- Gradle: feature deprecate usate, incompatibili con Gradle 9.0; daemon segnala metaspace 512 MiB insufficiente durante APK build.

### Blocker
- Size gate risolto: intro audio convertito da WAV PCM a MP3 96 kbps; APK 12.21 MB sotto limite `scripts/check-apk-size.mjs` di 12.3 MB.
- Primo tentativo AAB in sandbox bloccato da `~/.gradle/...gradle-8.13-bin.zip.lck` read-only; rieseguito fuori sandbox e completato.

## Rischi
- Build locale non riproduce configurazione Play Store.
- Warning esistenti confusi con regressioni da refactor.
- Dipendenze o SDK mancanti bloccano baseline.

## Verifiche
- Comando build release eseguito; blocker size gate documentato.
- Output principale salvato nel task/report della sessione.
- Differenze future confrontabili con baseline.

## Criteri Done
- [x] Baseline release chiara.
- [x] Blocker ambiente, se presenti, espliciti.
- [x] Nessun codice modificato senza analisi mirata.
