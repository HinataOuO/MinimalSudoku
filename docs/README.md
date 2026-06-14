# MinimalSudoku Docs

Questa cartella spiega cosa e stato creato finora, come funziona il progetto e
perché alcune scelte tecniche sono state fatte in questo modo.

## Ordine consigliato

1. [Setup e stack](./01-setup-e-stack.md)
2. [Architettura](./02-architettura.md)
3. [Sudoku engine](./03-sudoku-engine.md)
4. [State management](./04-state-management.md)
5. [UI e navigazione](./05-ui-e-navigazione.md)
6. [Test e qualita](./06-test-e-qualita.md)
7. [Roadmap e prossimi passi](./07-roadmap-e-prossimi-passi.md)

## Cosa esiste ora

Il progetto e una app mobile Sudoku offline. L'utente sceglie difficolta, gioca
una griglia 9x9, inserisce numeri, vede errori, completa puzzle, riavvia partita
e puo riprendere lo stato salvato.

Le parti principali sono:

- `src/app`: schermate Expo Router.
- `src/components`: componenti UI riutilizzabili.
- `src/features/sudoku`: logica Sudoku pura, senza React Native.
- `src/store`: stato globale e persistenza.
- `src/theme`: colori e stile globale.
- `__tests__`: test automatici.
- `roadmap`: stato progetto e prossime macro-task.

## Regola mentale del progetto

La UI non deve sapere come si genera o risolve un Sudoku. La UI chiede allo
store cosa mostrare e invia azioni. Lo store usa engine Sudoku e salva stato.
L'engine resta isolato, testabile e riutilizzabile.

Flusso breve:

```text
Schermata / componente
  -> azione Zustand
  -> engine Sudoku se serve
  -> nuovo stato persistito
  -> UI si aggiorna
```

## Nota per sviluppatori

Questa documentazione non duplica tutti i file sorgente. Usa snippet mirati e
rimanda ai path reali. Quando codice e docs divergono, il codice e fonte finale;
aggiornare docs insieme alle macro-task importanti.
