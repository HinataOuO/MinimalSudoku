# Architettura

## Strati del progetto

La struttura principale e questa:

```text
src/
  app/                 schermate e navigazione
  components/          UI riutilizzabile
  features/sudoku/     engine Sudoku puro
  store/               stato globale e persistenza
  theme/               colori e CSS NativeWind
  utils/               utility generiche
```

## Flusso dati

Esempio: utente preme numero `5`.

```text
NumberPad
  -> useGameStore().setCellValue(5)
  -> gameStore controlla puzzle, cella selezionata, soluzione
  -> aggiorna userGrid, mistakes, status
  -> SudokuGrid si ridisegna con nuovo stato
```

La UI non modifica direttamente la griglia. Chiama azioni dello store.

## Separazione UI / engine

L'engine Sudoku vive in `src/features/sudoku`. Non importa React, React Native,
Zustand o AsyncStorage.

Questo serve per tre motivi:

- **testabilita**: solver/generator si testano con Jest senza renderizzare UI.
- **manutenibilita**: regole Sudoku stanno in un punto solo.
- **riuso**: stesso engine potrebbe funzionare in web, mobile o backend.

## Responsabilita

`src/app` contiene schermate:

- `_layout.tsx`: stack navigation globale.
- `index.tsx`: home con Play/Resume.
- `difficulty.tsx`: scelta difficolta.
- `game.tsx`: partita.

`src/components` contiene pezzi visivi:

- `Button`: bottone base.
- `Card`: contenitore minimal.
- `SudokuGrid`: griglia 9x9 interattiva.
- `NumberPad`: tastierino numerico.

`src/store/gameStore.ts` coordina stato:

- crea nuova partita;
- seleziona cella;
- inserisce numero;
- registra errori;
- completa puzzle;
- riavvia;
- salva su AsyncStorage.

`src/features/sudoku` contiene logica pura:

- `types.ts`: tipi condivisi.
- `validator.ts`: regole e controlli.
- `solver.ts`: backtracking e conteggio soluzioni.
- `generator.ts`: generazione puzzle.

## Per sviluppatori

Lo store e l'unico ponte tra UI ed engine. Questo evita dipendenze circolari:

```text
components -> store -> features/sudoku
app        -> store
store      -> features/sudoku
features   -> nessuna dipendenza UI
```

Regola pratica: se una funzione riguarda regole Sudoku, va in `features/sudoku`.
Se riguarda interazione utente o salvataggio partita, va nello store. Se riguarda
rendering, va in componenti o schermate.
