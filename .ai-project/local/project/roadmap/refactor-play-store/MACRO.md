# Refactor Play Store

---
id: refactor-play-store
status: wip
updated: 2026-07-01
layers:
  baseline-release: done
  sudoku-engine: done
  store-state: done
  ui-render: done
  audio-assets: done
  dependencies: todo
  android-release: todo
  verification: todo
---

## Obiettivo
- [ ] Preparare refactor selettivi per pulizia, stabilita e pubblicazione Play Store.
- [ ] Eseguire un solo topic alla volta, dopo analisi mirata del file topic.
- [ ] Evitare implementazioni speculative fuori dal topic attivo.

## Topic
- [x] `01-baseline-release.md` - baseline build/release prima dei refactor.
- [x] `02-sudoku-engine.md` - motore Sudoku e logica di puzzle.
- [x] `03-store-state.md` - stato app, persistenza e flussi dati.
- [x] `04-ui-render.md` - rendering UI e performance interazione.
- [x] `05-audio-assets.md` - audio, asset e peso bundle.
- [ ] `06-dependencies.md` - dipendenze e superficie runtime.
- [ ] `07-android-release.md` - configurazione release Android/Play Store.
- [ ] `08-verification.md` - verifica finale e regressioni.

## Regole
- [ ] Prima di ogni task futura, leggere il topic relativo.
- [ ] Prima di editare codice, fare analisi puntuale dei file coinvolti.
- [ ] Chiudere ogni topic solo con verifiche eseguite o blocker esplicito.
