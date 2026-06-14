# UI e navigazione

## Expo Router

Expo Router usa file dentro `src/app` per definire schermate.

File attuali:

- `_layout.tsx`: layout globale e stack.
- `index.tsx`: home.
- `difficulty.tsx`: scelta difficolta.
- `game.tsx`: partita.

Navigazione esempio:

```ts
router.push("/difficulty");
router.replace("/game");
```

`push` aggiunge schermata allo stack. `replace` sostituisce schermata corrente,
utile dopo scelta difficolta per entrare direttamente in partita.

## Home

La home mostra titolo, descrizione, bottone `Play` e, se esiste partita salvata,
anche `Resume`.

Il controllo e semplice:

```ts
const hasGame = useGameStore((state) => state.puzzle !== null);
```

Se store contiene puzzle, utente puo riprendere.

## Difficulty

La schermata difficolta legge valori da `DIFFICULTIES`, quindi UI e tipi restano
allineati.

```ts
{DIFFICULTIES.map((difficulty) => (
  <Button
    key={difficulty}
    label={difficulty[0].toUpperCase() + difficulty.slice(1)}
    onPress={() => {
      startNewGame(difficulty);
      router.replace("/game");
    }}
  />
))}
```

Se domani si aggiunge difficolta in `types.ts`, questa schermata puo adattarsi
senza duplicare lista a mano.

## Game screen

`game.tsx` compone:

- header con difficolta;
- bottone restart;
- `SudokuGrid`;
- `NumberPad`;
- messaggio completamento.

Se non esiste puzzle, mostra fallback con bottone per scegliere difficolta.

## SudokuGrid

La griglia e responsive:

```ts
const { width } = useWindowDimensions();
const size = Math.min(width - 32, 420);
const cellSize = size / 9;
```

Su telefoni piccoli usa larghezza disponibile. Su schermi grandi si ferma a
420px per non diventare enorme.

Ogni cella decide colore in base a stato:

```ts
backgroundColor: mistake
  ? colors.dangerSoft
  : isSelected
    ? colors.selectedCell
    : fixed
      ? colors.fixedCell
      : related
        ? colors.relatedCell
        : colors.panel
```

Priorita visiva:

1. errore;
2. selezione;
3. cella fissa;
4. cella correlata;
5. cella normale.

## NumberPad

Il tastierino mostra numeri 1-9 e `Clear`. Se nessuna cella modificabile e
selezionata, i bottoni sono disabilitati.

```ts
const disabled = selectedCell === null;
```

Questo evita input senza target.

## NativeWind e tema

NativeWind permette classi tipo:

```tsx
<View className="flex-1 justify-center gap-6 px-6" />
```

I colori custom stanno in `tailwind.config.js` e `src/theme/colors.ts`.

Motivo doppio:

- classi NativeWind comode per layout e stile comune;
- `colors.ts` utile quando React Native richiede valore JS in `style`.

## Per sviluppatori

La UI e abbastanza "dumb": renderizza stato e chiama azioni. Logica di partita
non deve entrare nei componenti, tranne logica visiva locale come `isRelated`.

Regola pratica:

- se cambia come appare cella, modificare `SudokuGrid`;
- se cambia cosa succede quando inserisci numero, modificare `gameStore`;
- se cambia validita Sudoku, modificare `features/sudoku`.
