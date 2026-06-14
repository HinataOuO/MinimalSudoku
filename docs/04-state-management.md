# State management

## Cosa fa lo store

Lo store in `src/store/gameStore.ts` e il cervello della partita. Contiene lo
stato corrente e le azioni che la UI puo chiamare.

Stato principale:

```ts
type GameState = {
  puzzle: SudokuPuzzle | null;
  userGrid: SudokuGrid | null;
  selectedCell: CellPosition | null;
  difficulty: Difficulty;
  status: GameStatus;
  mistakes: MistakeMap;
};
```

Azioni principali:

- `startNewGame(difficulty)`: genera nuovo puzzle.
- `restartGame()`: torna alla griglia iniziale.
- `selectCell(cell)`: seleziona cella modificabile.
- `setCellValue(value)`: inserisce numero.
- `clearSelectedCell()`: cancella valore utente.

## Perché `puzzle` e `userGrid` sono separati

`puzzle.givens` rappresenta la griglia iniziale. Non va modificata perché serve
per sapere quali celle sono fisse.

`userGrid` rappresenta cosa vede l'utente durante la partita. Cambia quando
l'utente inserisce o cancella numeri.

Esempio:

```text
puzzle.givens: cella originale fissa o vuota
userGrid:      stato attuale con input utente
solution:      risposta corretta
```

## Nuova partita

Snippet:

```ts
startNewGame: (difficulty) => {
  const puzzle = generatePuzzle(difficulty);
  set({
    puzzle,
    userGrid: cloneGrid(puzzle.givens),
    selectedCell: null,
    difficulty,
    status: "playing",
    mistakes: {}
  });
}
```

Quando parte nuova partita:

1. engine genera puzzle;
2. `userGrid` parte da copia di `givens`;
3. stato diventa `playing`;
4. errori vengono svuotati.

`cloneGrid` evita di modificare accidentalmente `puzzle.givens`.

## Inserire un numero

Quando utente seleziona cella e preme un numero:

```ts
const isMistake = puzzle.solution[selectedCell.row][selectedCell.col] !== value;

if (isMistake) {
  mistakes[mistakeKey] = true;
} else {
  delete mistakes[mistakeKey];
}
```

Lo store confronta input con soluzione. Se numero e sbagliato, marca cella in
`mistakes`. Se e corretto, rimuove eventuale errore.

Poi controlla completamento:

```ts
status: isPuzzleCompleted(nextGrid, puzzle.solution) ? "completed" : "playing"
```

## Persistenza

Lo store usa middleware Zustand `persist` con AsyncStorage:

```ts
persist(
  (set, get) => ({ /* stato e azioni */ }),
  {
    name: "minimal-sudoku-game",
    storage: createJSONStorage(() => AsyncStorage)
  }
)
```

Questo salva stato su storage locale del device. Se app viene chiusa e riaperta,
partita puo essere ripresa.

## Per sviluppatori

Lo store e volutamente sottile: orchestra engine e UI, ma non contiene algoritmo
di Sudoku. Questo mantiene confini chiari.

Scelte importanti:

- azioni mutano stato solo tramite `set`;
- griglie vengono clonate prima di modificarle;
- celle fisse non sono selezionabili/modificabili;
- errori sono `Record<string, boolean>` con chiave `row-col`, semplice da usare
  in rendering.

Possibile miglioramento futuro: rendere funzioni come `isPuzzleCompleted` export
testabili direttamente o spostarle in utility pure.
