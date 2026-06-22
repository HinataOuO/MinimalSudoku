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
import { cloneGrid } from "@/features/sudoku/validator";
import { defaultThemeMode, type ThemeMode } from "@/theme/types";

type MistakeMap = Record<string, boolean>;
type NoteGrid = FilledCellValue[][][];

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
  hardModeEnabled: boolean;
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
  setHardModeEnabled: (enabled: boolean) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  toggleThemeMode: () => void;
  toggleNoteMode: () => void;
  startNewGame: (difficulty: Difficulty) => void;
  startNewGameAsync: (difficulty: Difficulty) => Promise<void>;
  restartGame: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  selectCell: (cell: CellPosition) => void;
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

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      isGenerating: false,
      generationError: null,
      puzzle: null,
      userGrid: null,
      noteGrid: createEmptyNoteGrid(),
      isNoteMode: false,
      hardModeEnabled: false,
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
        set((state) => ({ isNoteMode: !state.isNoteMode }));
      },

      setHardModeEnabled: (enabled) => {
        set({ hardModeEnabled: enabled });
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

      setCellValue: (value) => {
        const {
          puzzle,
          selectedCell,
          status,
          userGrid,
          noteGrid,
          isNoteMode,
          hardModeEnabled
        } = get();
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
        const currentValueIsCorrect =
          currentValue === puzzle.solution[selectedCell.row][selectedCell.col];
        if (!hardModeEnabled && currentValueIsCorrect) {
          return;
        }

        if (isNoteMode) {
          if (currentValue !== 0) {
            return;
          }

          const currentNotes = noteGrid[selectedCell.row][selectedCell.col];
          const nextNotes = currentNotes.includes(value)
            ? currentNotes.filter((note) => note !== value)
            : [...currentNotes, value].sort((a, b) => a - b);
          const nextNoteGrid = cloneNoteGrid(noteGrid);
          nextNoteGrid[selectedCell.row][selectedCell.col] = nextNotes;

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
          return;
        }

        if (currentValue === value) {
          return;
        }

        const nextGrid = cloneGrid(userGrid);
        nextGrid[selectedCell.row][selectedCell.col] = value;
        const nextNoteGrid = cloneNoteGrid(noteGrid);
        nextNoteGrid[selectedCell.row][selectedCell.col] = [];

        const mistakeKey = keyForCell(selectedCell);
        const mistakes = { ...get().mistakes };
        const isMistake = puzzle.solution[selectedCell.row][selectedCell.col] !== value;
        const nextMistakeCount = isMistake ? get().mistakeCount + 1 : get().mistakeCount;
        const nextStatus = isMistake
          ? nextMistakeCount >= 3
            ? "lost"
            : "playing"
          : isPuzzleCompleted(nextGrid, puzzle.solution)
            ? "completed"
            : "playing";

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

      highlightNumber: (value) => {
        set({ highlightedNumber: value });
      },

      clearHighlightedNumber: () => {
        set({ highlightedNumber: null });
      },

      clearSelectedCell: () => {
        const { puzzle, selectedCell, status, userGrid, noteGrid, hardModeEnabled } = get();
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

        if (
          !hardModeEnabled &&
          currentValue === puzzle.solution[selectedCell.row][selectedCell.col]
        ) {
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
    }),
    {
      name: "minimal-sudoku-game",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        puzzle: state.puzzle,
        userGrid: state.userGrid,
        noteGrid: state.noteGrid,
        hardModeEnabled: state.hardModeEnabled,
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
