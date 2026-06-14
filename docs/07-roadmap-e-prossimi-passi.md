# Roadmap e prossimi passi

## Dove sta la roadmap

La roadmap operativa sta in `roadmap/`:

- `roadmap/README.md`: macro-task e milestone.
- `roadmap/progress.md`: avanzamento.
- `roadmap/decisions.md`: decisioni tecniche.
- `roadmap/backlog.md`: idee future.

`docs/` spiega progetto. `roadmap/` traccia cosa fare.

## Cosa e gia fatto

Gia implementato:

- bootstrap Expo TypeScript;
- Expo Router;
- NativeWind;
- engine Sudoku indipendente;
- generator/solver/validator;
- Zustand store;
- AsyncStorage persistence;
- schermate Home, Difficulty, Game;
- componenti base;
- test engine iniziali;
- dev server Expo funzionante.

## Prossima macro-task consigliata

Prima di aggiungere feature, fare QA Android:

```text
aprire app su Android
scegliere difficolta
inserire numeri corretti/sbagliati
ruotare o cambiare dimensione se possibile
chiudere e riaprire app
verificare resume
```

Motivo: app e mobile. Prima validare esperienza reale su device/emulatore, poi
espandere feature.

## Macro-task successive

1. **Store tests**
   - Coprire azioni principali.
   - Ridurre rischio regressioni.

2. **UI refinement**
   - Touch target.
   - Spaziature.
   - Feedback errori.
   - Accessibilita.

3. **Notes mode**
   - Candidati per cella.
   - Nuovo stato nello store.
   - UI tastierino con toggle.

4. **Timer**
   - Tempo partita.
   - Pausa/resume.
   - Persistenza.

5. **Hints**
   - Suggerimento controllato.
   - Conteggio hint usati.
   - Possibile impatto su statistiche.

## Come aggiornare docs

Quando si cambia architettura o comportamento utente:

1. aggiornare codice;
2. aggiornare test;
3. aggiornare file `docs/` corrispondente;
4. segnare decisione importante in `roadmap/decisions.md`;
5. segnare avanzamento in `roadmap/progress.md`.

## Per sviluppatori

Non usare `docs/` come backlog tecnico dettagliato. Usarlo come spiegazione del
sistema. La roadmap decide priorita, i docs spiegano il perché e il come.

Quando una feature diventa grande, aggiungere un file docs dedicato solo se
introduce nuovi concetti stabili. Esempio: `notes mode` probabilmente merita un
file o sezione dedicata, perché cambia stato, UI e regole di input.
