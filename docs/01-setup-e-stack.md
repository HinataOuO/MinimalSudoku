# Setup e stack

## Stack usato

Il progetto usa:

- **Expo**: toolchain per avviare app React Native senza configurare subito
  progetti Android/iOS nativi.
- **React Native**: componenti mobile come `View`, `Text`, `Pressable`.
- **TypeScript**: tipi statici per ridurre errori su griglie, difficolta, stato.
- **Expo Router**: navigazione basata su file in `src/app`.
- **NativeWind**: classi stile Tailwind su React Native.
- **Zustand**: store globale semplice.
- **AsyncStorage**: persistenza locale offline.
- **Jest + jest-expo**: test automatici.

## Comandi principali

Installare dipendenze:

```bash
npm install
```

Avviare Expo:

```bash
npm run start
```

Controllare TypeScript:

```bash
npm run typecheck
```

Eseguire test:

```bash
npm test -- --runInBand
```

## Provare su Android

Metodo piu semplice con telefono fisico:

1. Installa **Expo Go** dal Play Store.
2. Avvia server:

   ```bash
   npm run start
   ```

3. Telefono e PC devono stare sulla stessa rete Wi-Fi.
4. Scansiona QR con Expo Go.

Con emulatore Android Studio:

1. Avvia emulatore.
2. Avvia Expo:

   ```bash
   npm run start
   ```

3. Premi `a` nel terminale Expo.

Se server e stato avviato con `--localhost`, va bene per emulatore locale, ma
puo non funzionare su telefono fisico. Per telefono fisico usare LAN con
`npm run start`.

## Perché queste scelte

Expo riduce setup iniziale e permette di provare presto UI e logica su Android.
TypeScript e importante perché Sudoku usa strutture dati molto rigide: una
griglia deve essere 9x9, le celle devono contenere numeri 0-9, difficolta deve
essere una tra valori noti.

Zustand evita boilerplate rispetto a Redux e basta per questa app. AsyncStorage
e adatto perché lo stato da salvare e piccolo: puzzle, input utente, selezione,
difficolta, errori.

## File di configurazione

- `package.json`: script, dipendenze, config Jest.
- `app.json`: configurazione Expo.
- `tsconfig.json`: TypeScript strict e alias `@/*`.
- `babel.config.js`: preset Expo + NativeWind.
- `metro.config.js`: Metro bundler con NativeWind.
- `tailwind.config.js`: colori e contenuti NativeWind.
