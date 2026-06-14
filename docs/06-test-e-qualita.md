# Test e qualita

## Test presenti

I test sono in `__tests__/sudoku/solver.test.ts`.

Coprono:

- solver risolve puzzle valido;
- puzzle noto ha soluzione unica;
- generator produce puzzle risolvibile e unico.

Esempio:

```ts
const solution = solveSudoku(puzzle);

expect(solution).not.toBeNull();
expect(isSolvedGrid(solution!)).toBe(true);
```

Questo verifica che il solver ritorni una griglia completa e valida.

## Come eseguire controlli

TypeScript:

```bash
npm run typecheck
```

Test:

```bash
npm test -- --runInBand
```

`--runInBand` esegue test in un solo processo. In progetti piccoli e ambienti
con sandbox/cache, e piu prevedibile.

## Qualita gia coperta

TypeScript strict aiuta a evitare errori tipo difficolta non valida o valore
cella fuori dominio.

Engine Sudoku e separato dalla UI, quindi test non dipendono da rendering mobile.

Generator controlla unicita con `hasUniqueSolution`, quindi puzzle non dovrebbe
avere piu risposte valide.

## Gap attuali

Mancano ancora:

- test store per `startNewGame`, `setCellValue`, `restartGame`;
- test persistence AsyncStorage;
- test UI per navigazione e interazioni;
- benchmark generator su device lento;
- visual QA su Android reale.

## Prossimi test consigliati

Store:

```text
startNewGame("easy")
  -> puzzle non null
  -> userGrid uguale givens
  -> status "playing"
```

Input corretto:

```text
seleziona cella vuota
inserisci valore soluzione
  -> mistakes non contiene cella
```

Input sbagliato:

```text
seleziona cella vuota
inserisci valore diverso da soluzione
  -> mistakes contiene "row-col"
```

Restart:

```text
dopo input utente
restartGame()
  -> userGrid torna a givens
  -> mistakes vuoto
```

## Per sviluppatori

Priorita test prossima fase:

1. store actions, perché definiscono comportamento utente;
2. edge case engine, perché generator/solver sono parte critica;
3. UI smoke tests, quando UX si stabilizza.

Non conviene testare subito dettagli visuali fragili. Meglio testare contratti:
stato iniziale, input, errori, completamento, persistenza.
