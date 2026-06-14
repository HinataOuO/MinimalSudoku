# Sudoku Mobile App

## Goal

Create a lightweight mobile Sudoku game with a minimal and elegant UI inspired by shadcn design principles. The application should focus on simplicity, performance, maintainability, and clean code architecture.

## Tech Stack

* React Native
* Expo
* TypeScript
* Zustand (state management)
* Expo Router (navigation)
* NativeWind (styling)
* AsyncStorage (local persistence)

## Core Features

### Home Screen

* Clean minimal interface
* "Play" button
* Difficulty selection

### Difficulty Levels

* Easy
* Medium
* Hard
* Expert

### Game Screen

* Sudoku grid
* Number keypad
* Cell selection
* Move validation
* Puzzle completion detection
* Restart game

## Architecture

The Sudoku engine must be completely independent from the UI layer.

### Sudoku Engine

Responsible for:

* Solution generation
* Puzzle generation
* Puzzle validation
* Solution uniqueness checks
* Difficulty management

### State Management

Store:

* Current puzzle
* Selected cell
* User inputs
* Difficulty
* Game status

## Suggested Folder Structure

src/
├── app/
│   ├── index.tsx
│   ├── difficulty.tsx
│   └── game.tsx
│
├── components/
│   ├── Button.tsx
│   ├── SudokuGrid.tsx
│   ├── NumberPad.tsx
│   └── Card.tsx
│
├── features/
│   └── sudoku/
│       ├── generator.ts
│       ├── solver.ts
│       ├── validator.ts
│       └── types.ts
│
├── store/
│   └── gameStore.ts
│
├── theme/
│   └── colors.ts
│
└── utils/

## Design Principles

* Minimal UI
* Fast startup time
* No unnecessary dependencies
* Strong TypeScript typing
* Clear separation between business logic and presentation
* Reusable components
* Offline-first experience

## Non-Functional Requirements

* Small bundle size
* High performance on low-end devices
* Clean and maintainable codebase
* Easy future expansion (statistics, timer, hints, daily challenges)

## Future Enhancements

* Timer
* Statistics
* Daily Sudoku
* Dark mode
* Notes mode
* Hint system
* Game history
* Achievement system
