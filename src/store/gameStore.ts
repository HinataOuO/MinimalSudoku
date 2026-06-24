import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { generatePuzzle } from "@/features/sudoku/generator";
import {
  CellPosition,
  CellValue,
  Difficulty,
  FilledCellValue,
  GameStatus,
  SudokuGrid,
  SudokuPuzzle
} from "@/features/sudoku/types";
import { cloneGrid, isNumberCompleted } from "@/features/sudoku/validator";
import { defaultThemeMode, type ThemeMode } from "@/theme/types";

type MistakeMap = Record<string, boolean>;
type NoteGrid = FilledCellValue[][][];
type LegacyPersistedGameState = Record<string, unknown> & {
  hardModeEnabled?: boolean;
};

type MoveSnapshot = {
  userGrid: SudokuGrid;
  noteGrid: NoteGrid;
  selectedCell: CellPosition | null;
  status: GameStatus;
  mistakes: MistakeMap;
  mistakeCount: number;
  finishedAt: number | null;
};

type GameState = {
  hasHydrated: boolean;
  isGenerating: boolean;
  generationError: string | null;
  puzzle: SudokuPuzzle | null;
  userGrid: SudokuGrid | null;
  noteGrid: NoteGrid;
  isNoteMode: boolean;
  isRapidInputMode: boolean;
  rapidInputValue: FilledCellValue | null;
  arcadeModeEnabled: boolean;
  themeMode: ThemeMode;
  selectedCell: CellPosition | null;
  highlightedNumber: FilledCellValue | null;
  difficulty: Difficulty;
  status: GameStatus;
  mistakes: MistakeMap;
  mistakeCount: number;
  moveHistory: MoveSnapshot[];
  startedAt: number | null;
  finishedAt: number | null;
  elapsedMs: number;
  setHasHydrated: (hasHydrated: boolean) => void;
  setArcadeModeEnabled: (enabled: boolean) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  toggleThemeMode: () => void;
  toggleNoteMode: () => void;
  toggleRapidInputMode: () => void;
  setRapidInputValue: (value: FilledCellValue) => void;
  startNewGame: (difficulty: Difficulty) => void;
  startNewGameAsync: (difficulty: Difficulty) => Promise<void>;
  restartGame: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  selectCell: (cell: CellPosition) => void;
  pressCell: (cell: CellPosition) => void;
  setCellValue: (value: Exclude<CellValue, 0>) => void;
  highlightNumber: (value: FilledCellValue) => void;
  clearHighlightedNumber: () => void;
  clearSelectedCell: () => void;
  clearSelectedCellNotes: () => void;
  undoLastMove: () => void;
};

function createEmptyNoteGrid(): NoteGrid {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
}

function cloneNoteGrid(grid: NoteGrid): NoteGrid {
  return grid.map((row) => row.map((notes) => [...notes]));
}

function keyForCell(cell: CellPosition) {
  return `${cell.row}-${cell.col}`;
}

function isPuzzleCompleted(grid: SudokuGrid, solution: SudokuGrid): boolean {
  return grid.every((row, rowIndex) =>
    row.every((value, colIndex) => value === solution[rowIndex][colIndex])
  );
}

function elapsedMsForSegment(startedAt: number | null, now: number): number {
  return startedAt === null ? 0 : Math.max(0, now - startedAt);
}

export function migrateGameStoreState(
  persistedState: unknown,
  version: number
): unknown {
  if (
    version >= 1 ||
    persistedState === null ||
    typeof persistedState !== "object" ||
    Array.isArray(persistedState)
  ) {
    return persistedState;
  }

  const {
    hardModeEnabled: _legacyHardModeEnabled,
    ...state
  } = persistedState as LegacyPersistedGameState;

  return {
    ...state,
    arcadeModeEnabled: true
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      const applyCellValue = (
        cell: CellPosition,
        value: FilledCellValue,
        noteMode: boolean,
        historySelectedCell: CellPosition | null
      ) => {
        const {
          arcadeModeEnabled,
          isRapidInputMode,
          noteGrid,
          puzzle,
          rapidInputValue,
          status,
          userGrid
        } = get();
        if (!puzzle || !userGrid || status !== "playing") {
          return;
        }

        if (puzzle.givens[cell.row][cell.col] !== 0) {
          return;
        }

        const currentValue = userGrid[cell.row][cell.col];
        const currentValueIsCorrect = currentValue === puzzle.solution[cell.row][cell.col];
        if (currentValueIsCorrect) {
          return;
        }

        if (noteMode) {
          if (currentValue !== 0) {
            return;
          }

          const currentNotes = noteGrid[cell.row][cell.col];
          const nextNotes = currentNotes.includes(value)
            ? currentNotes.filter((note) => note !== value)
            : [...currentNotes, value].sort((a, b) => a - b);
          const nextNoteGrid = cloneNoteGrid(noteGrid);
          nextNoteGrid[cell.row][cell.col] = nextNotes;

          set({
            noteGrid: nextNoteGrid,
            moveHistory: [
              ...get().moveHistory,
              {
                userGrid: cloneGrid(userGrid),
                noteGrid: cloneNoteGrid(noteGrid),
                selectedCell: historySelectedCell,
                status: get().status,
                mistakes: { ...get().mistakes },
                mistakeCount: get().mistakeCount,
                finishedAt: get().finishedAt
              }
            ]
          });
          return;
        }

        if (currentValue === value) {
          return;
        }

        const nextGrid = cloneGrid(userGrid);
        nextGrid[cell.row][cell.col] = value;
        const nextNoteGrid = cloneNoteGrid(noteGrid);
        nextNoteGrid[cell.row][cell.col] = [];

        const mistakeKey = keyForCell(cell);
        const mistakes = { ...get().mistakes };
        const isMistake = puzzle.solution[cell.row][cell.col] !== value;
        const nextMistakeCount = isMistake ? get().mistakeCount + 1 : get().mistakeCount;
        const nextStatus = isMistake
          ? nextMistakeCount >= 3
            ? "lost"
            : "playing"
          : isPuzzleCompleted(nextGrid, puzzle.solution)
            ? "completed"
            : "playing";
        const rapidNumberCompleted =
          !isMistake &&
          arcadeModeEnabled &&
          isRapidInputMode &&
          rapidInputValue === value &&
          isNumberCompleted(nextGrid, puzzle.solution, value);

        if (isMistake) {
          mistakes[mistakeKey] = true;
        } else {
          delete mistakes[mistakeKey];
        }

        const now = Date.now();
        const currentElapsedMs =
          get().elapsedMs + elapsedMsForSegment(get().startedAt, now);

        set({
          userGrid: nextGrid,
          noteGrid: nextNoteGrid,
          mistakes,
          mistakeCount: nextMistakeCount,
          status: nextStatus,
          startedAt: nextStatus === "playing" ? get().startedAt : null,
          finishedAt: nextStatus === "playing" ? null : now,
          elapsedMs: nextStatus === "playing" ? get().elapsedMs : currentElapsedMs,
          rapidInputValue: rapidNumberCompleted ? null : rapidInputValue,
          moveHistory: [
            ...get().moveHistory,
            {
              userGrid: cloneGrid(userGrid),
              noteGrid: cloneNoteGrid(noteGrid),
              selectedCell: historySelectedCell,
              status: get().status,
              mistakes: { ...get().mistakes },
              mistakeCount: get().mistakeCount,
              finishedAt: get().finishedAt
            }
          ]
        });
      };

      return {
        hasHydrated: false,
        isGenerating: false,
        generationError: null,
        puzzle: null,
        userGrid: null,
        noteGrid: createEmptyNoteGrid(),
        isNoteMode: false,
        isRapidInputMode: false,
        rapidInputValue: null,
        arcadeModeEnabled: true,
        themeMode: defaultThemeMode,
        selectedCell: null,
        highlightedNumber: null,
        difficulty: "easy",
        status: "idle",
        mistakes: {},
        mistakeCount: 0,
        moveHistory: [],
        startedAt: null,
        finishedAt: null,
        elapsedMs: 0,

        setHasHydrated: (hasHydrated) =>
          set((state) => ({
            hasHydrated,
            startedAt: hasHydrated && state.status === "playing" ? null : state.startedAt
          })),

        toggleNoteMode: () => {
          set((state) => ({
            isNoteMode: !state.isNoteMode,
            isRapidInputMode: state.isNoteMode ? state.isRapidInputMode : false,
            rapidInputValue: state.isNoteMode ? state.rapidInputValue : null
          }));
        },

      toggleRapidInputMode: () => {
        set((state) => {
          if (!state.arcadeModeEnabled || state.status !== "playing") {
            return {};
          }

          const isRapidInputMode = !state.isRapidInputMode;
          return {
            isRapidInputMode,
            rapidInputValue: isRapidInputMode ? state.rapidInputValue : null,
            isNoteMode: isRapidInputMode ? false : state.isNoteMode
          };
        });
      },

      setRapidInputValue: (value) => {
        const { arcadeModeEnabled, isRapidInputMode, status } = get();
        if (!arcadeModeEnabled || !isRapidInputMode || status !== "playing") {
          return;
        }

        set({ rapidInputValue: value });
      },

      setArcadeModeEnabled: (enabled) => {
        set({
          arcadeModeEnabled: enabled,
          isRapidInputMode: false,
          rapidInputValue: null
        });
      },

      setThemeMode: (themeMode) => {
        set({ themeMode });
      },

      toggleThemeMode: () => {
        set((state) => ({ themeMode: state.themeMode === "dark" ? "light" : "dark" }));
      },

      startNewGame: (difficulty) => {
        const puzzle = generatePuzzle(difficulty);
        set({
          puzzle,
          userGrid: cloneGrid(puzzle.givens),
          noteGrid: createEmptyNoteGrid(),
          isNoteMode: false,
          isRapidInputMode: false,
          rapidInputValue: null,
          selectedCell: null,
          highlightedNumber: null,
          difficulty,
          status: "playing",
          isGenerating: false,
          generationError: null,
          mistakes: {},
          mistakeCount: 0,
          moveHistory: [],
          startedAt: Date.now(),
          finishedAt: null,
          elapsedMs: 0
        });
      },

      startNewGameAsync: async (difficulty) => {
        set({
          difficulty,
          isGenerating: true,
          generationError: null,
          puzzle: null,
          userGrid: null,
          noteGrid: createEmptyNoteGrid(),
          isNoteMode: false,
          isRapidInputMode: false,
          rapidInputValue: null,
          selectedCell: null,
          highlightedNumber: null,
          status: "idle",
          mistakes: {},
          mistakeCount: 0,
          moveHistory: [],
          startedAt: null,
          finishedAt: null,
          elapsedMs: 0
        });

        try {
          await new Promise((resolve) => setTimeout(resolve, 0));
          const puzzle = generatePuzzle(difficulty);

          set({
            puzzle,
            userGrid: cloneGrid(puzzle.givens),
            noteGrid: createEmptyNoteGrid(),
            isNoteMode: false,
            isRapidInputMode: false,
            rapidInputValue: null,
            selectedCell: null,
            highlightedNumber: null,
            difficulty,
            status: "playing",
            isGenerating: false,
            generationError: null,
            mistakes: {},
            mistakeCount: 0,
            moveHistory: [],
            startedAt: Date.now(),
            finishedAt: null,
            elapsedMs: 0
          });
        } catch (error) {
          set({
            isGenerating: false,
            generationError: error instanceof Error ? error.message : "Failed to generate puzzle",
            status: "idle",
            puzzle: null,
            userGrid: null,
            noteGrid: createEmptyNoteGrid(),
            isNoteMode: false,
            isRapidInputMode: false,
            rapidInputValue: null,
            selectedCell: null,
            highlightedNumber: null,
            mistakes: {},
            mistakeCount: 0,
            moveHistory: [],
            startedAt: null,
            finishedAt: null,
            elapsedMs: 0
          });
        }
      },

      restartGame: () => {
        const { puzzle } = get();
        if (!puzzle) {
          return;
        }

        set({
          userGrid: cloneGrid(puzzle.givens),
          noteGrid: createEmptyNoteGrid(),
          isNoteMode: false,
          isRapidInputMode: false,
          rapidInputValue: null,
          selectedCell: null,
          highlightedNumber: null,
          status: "playing",
          generationError: null,
          mistakes: {},
          mistakeCount: 0,
          moveHistory: [],
          startedAt: Date.now(),
          finishedAt: null,
          elapsedMs: 0
        });
      },

      pauseTimer: () => {
        const { status, startedAt, elapsedMs } = get();
        if (status !== "playing" || startedAt === null) {
          return;
        }

        set({
          startedAt: null,
          elapsedMs: elapsedMs + elapsedMsForSegment(startedAt, Date.now())
        });
      },

      resumeTimer: () => {
        const { status, startedAt } = get();
        if (status !== "playing" || startedAt !== null) {
          return;
        }

        set({
          startedAt: Date.now(),
          finishedAt: null
        });
      },

      selectCell: (cell) => {
        const { puzzle } = get();
        if (!puzzle) {
          return;
        }

        set({ selectedCell: cell });
      },

      pressCell: (cell) => {
        const {
          arcadeModeEnabled,
          isRapidInputMode,
          rapidInputValue,
          selectedCell,
          status
        } = get();
        if (status !== "playing") {
          return;
        }

        set({ selectedCell: cell });

        if (arcadeModeEnabled && isRapidInputMode && rapidInputValue !== null) {
          applyCellValue(cell, rapidInputValue, false, selectedCell);
        }
      },

      setCellValue: (value) => {
        const { selectedCell, isNoteMode } = get();
        if (!selectedCell) {
          return;
        }

        applyCellValue(selectedCell, value, isNoteMode, selectedCell);
      },

      highlightNumber: (value) => {
        set({ highlightedNumber: value });
      },

      clearHighlightedNumber: () => {
        set({ highlightedNumber: null });
      },

      clearSelectedCell: () => {
        const { puzzle, selectedCell, status, userGrid, noteGrid } = get();
        if (!puzzle || !selectedCell || !userGrid) {
          return;
        }

        if (status !== "playing") {
          return;
        }

        if (puzzle.givens[selectedCell.row][selectedCell.col] !== 0) {
          return;
        }

        const currentValue = userGrid[selectedCell.row][selectedCell.col];
        if (currentValue === 0) {
          return;
        }

        if (currentValue === puzzle.solution[selectedCell.row][selectedCell.col]) {
          return;
        }

        const nextGrid = cloneGrid(userGrid);
        nextGrid[selectedCell.row][selectedCell.col] = 0;

        const mistakes = { ...get().mistakes };
        delete mistakes[keyForCell(selectedCell)];

        set({
          userGrid: nextGrid,
          mistakes,
          status: "playing",
          moveHistory: [
            ...get().moveHistory,
            {
              userGrid: cloneGrid(userGrid),
              noteGrid: cloneNoteGrid(noteGrid),
              selectedCell,
              status: get().status,
              mistakes: { ...get().mistakes },
              mistakeCount: get().mistakeCount,
              finishedAt: get().finishedAt
            }
          ]
        });
      },

      clearSelectedCellNotes: () => {
        const { puzzle, selectedCell, status, userGrid, noteGrid } = get();
        if (!puzzle || !selectedCell || !userGrid) {
          return;
        }

        if (status !== "playing") {
          return;
        }

        if (puzzle.givens[selectedCell.row][selectedCell.col] !== 0) {
          return;
        }

        if (noteGrid[selectedCell.row][selectedCell.col].length === 0) {
          return;
        }

        const nextNoteGrid = cloneNoteGrid(noteGrid);
        nextNoteGrid[selectedCell.row][selectedCell.col] = [];

        set({
          noteGrid: nextNoteGrid,
          moveHistory: [
            ...get().moveHistory,
            {
              userGrid: cloneGrid(userGrid),
              noteGrid: cloneNoteGrid(noteGrid),
              selectedCell,
              status: get().status,
              mistakes: { ...get().mistakes },
              mistakeCount: get().mistakeCount,
              finishedAt: get().finishedAt
            }
          ]
        });
      },

      undoLastMove: () => {
        const { moveHistory, status } = get();
        if (status !== "playing") {
          return;
        }

        const previous = moveHistory[moveHistory.length - 1];
        if (!previous) {
          return;
        }

        set({
          userGrid: cloneGrid(previous.userGrid),
          noteGrid: cloneNoteGrid(previous.noteGrid ?? createEmptyNoteGrid()),
          selectedCell: previous.selectedCell,
          status: previous.status,
          mistakes: { ...previous.mistakes },
          finishedAt: previous.finishedAt ?? null,
          moveHistory: moveHistory.slice(0, -1)
        });
      }
      };
    },
    {
      name: "minimal-sudoku-game",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState, version) =>
        migrateGameStoreState(persistedState, version) as GameState,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        puzzle: state.puzzle,
        userGrid: state.userGrid,
        noteGrid: state.noteGrid,
        arcadeModeEnabled: state.arcadeModeEnabled,
        themeMode: state.themeMode,
        selectedCell: state.selectedCell,
        difficulty: state.difficulty,
        status: state.status,
        mistakes: state.mistakes,
        mistakeCount: state.mistakeCount,
        moveHistory: state.moveHistory,
        startedAt: state.startedAt,
        finishedAt: state.finishedAt,
        elapsedMs: state.elapsedMs
      })
    }
  )
);
