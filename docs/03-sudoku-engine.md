# Sudoku engine

## Concetti base

Una griglia Sudoku e una matrice 9x9. Nel codice il valore `0` significa cella
vuota. I numeri validi da inserire sono `1` fino a `9`.

Tipi principali in `src/features/sudoku/types.ts`:

```ts
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type SudokuGrid = CellValue[][];
export type Difficulty = "easy" | "medium" | "hard" | "expert";
```

Un puzzle contiene:

```ts
export type SudokuPuzzle = {
  givens: SudokuGrid;
  solution: SudokuGrid;
  difficulty: Difficulty;
};
```

`givens` e la griglia iniziale con celle vuote. `solution` e la soluzione
completa. Tenere entrambe serve per validare mosse e rilevare completamento.

## Validator

`validator.ts` controlla forma e regole.

Snippet:

```ts
export function canPlaceValue(
  grid: SudokuGrid,
  row: number,
  col: number,
  value: number
): boolean {
  if (value < 1 || value > 9) {
    return false;
  }
  // poi controlla riga, colonna e box 3x3
}
```

La regola Sudoku e sempre la stessa:

- stesso numero non puo comparire due volte nella stessa riga;
- stesso numero non puo comparire due volte nella stessa colonna;
- stesso numero non puo comparire due volte nello stesso box 3x3.

## Solver con backtracking

Il solver cerca una cella vuota, prova numeri possibili e torna indietro se una
scelta porta a vicolo cieco.

Idea semplificata:

```text
trova cella vuota
prova 1..9
  se numero valido:
    metti numero
    prova a risolvere resto griglia
    se funziona, fine
    altrimenti svuota cella e prova altro numero
se nessun numero funziona, fallimento
```

Snippet da `solver.ts`:

```ts
for (const value of candidates) {
  if (canPlaceValue(working, row, col, value)) {
    working[row][col] = value;

    if (backtrack()) {
      return true;
    }

    working[row][col] = EMPTY_CELL;
  }
}
```

Questo e ricorsivo: `backtrack()` chiama se stesso finché la griglia e completa
o impossibile.

## Conteggio soluzioni

Per verificare unicita, non basta trovare una soluzione. Bisogna sapere se ne
esiste piu di una.

`countSolutions(grid, 2)` conta fino a 2 soluzioni e poi si ferma. Se arriva a
2, puzzle non e unico.

```ts
export function hasUniqueSolution(grid: SudokuGrid): boolean {
  return countSolutions(grid, 2) === 1;
}
```

Questo limite evita lavoro inutile: per sapere che un puzzle non e unico basta
trovare due soluzioni.

## Generazione puzzle

`generator.ts` fa tre passi:

1. genera una soluzione completa casuale;
2. copia soluzione in `givens`;
3. rimuove celle una alla volta solo se puzzle resta con soluzione unica.

Snippet:

```ts
const previous = givens[row][col];
givens[row][col] = EMPTY_CELL;

if (hasUniqueSolution(givens)) {
  removals += 1;
} else {
  givens[row][col] = previous;
}
```

Se togliere una cella rende il puzzle ambiguo, il valore viene rimesso.

## Difficolta

La difficolta ora dipende dal numero di celle rimosse:

```ts
const removalsByDifficulty: Record<Difficulty, number> = {
  easy: 36,
  medium: 44,
  hard: 50,
  expert: 56
};
```

Piu celle vuote in genere significa puzzle piu difficile. Non e una misura
perfetta: un vero rating Sudoku considera tecniche richieste per risolvere.

## Per sviluppatori

Questa implementazione punta a chiarezza e correttezza per v1. Backtracking e
semplice, testabile e sufficiente per generare puzzle mobile offline.

Limiti attuali:

- difficolta basata su numero rimozioni, non su tecniche logiche;
- generator puo diventare piu costoso su difficolta alte;
- non c'e seed riproducibile per puzzle giornalieri.

Miglioramenti futuri:

- solver con euristica "cella con meno candidati";
- rating per tecniche;
- seed deterministico per daily Sudoku;
- benchmark generator su device low-end.
