import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { generatePuzzle } from "@/features/sudoku/generator";
import {
  CellPosition,
  CellValue,
  Difficulty,
  GameStatus,
  SudokuGrid,
  SudokuPuzzle
} from "@/features/sudoku/types";
import { cloneGrid } from "@/features/sudoku/validator";

type MistakeMap = Record<string, boolean>;

type MoveSnapshot = {
  userGrid: SudokuGrid;
  selectedCell: CellPosition | null;
  status: GameStatus;
  mistakes: MistakeMap;
};

type GameState = {
  hasHydrated: boolean;
  puzzle: SudokuPuzzle | null;
  userGrid: SudokuGrid | null;
  selectedCell: CellPosition | null;
  difficulty: Difficulty;
  status: GameStatus;
  mistakes: MistakeMap;
  moveHistory: MoveSnapshot[];
  setHasHydrated: (hasHydrated: boolean) => void;
  startNewGame: (difficulty: Difficulty) => void;
  restartGame: () => void;
  selectCell: (cell: CellPosition) => void;
  setCellValue: (value: Exclude<CellValue, 0>) => void;
  clearSelectedCell: () => void;
  undoLastMove: () => void;
};

function keyForCell(cell: CellPosition) {
  return `${cell.row}-${cell.col}`;
}

function isPuzzleCompleted(grid: SudokuGrid, solution: SudokuGrid): boolean {
  return grid.every((row, rowIndex) =>
    row.every((value, colIndex) => value === solution[rowIndex][colIndex])
  );
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      puzzle: null,
      userGrid: null,
      selectedCell: null,
      difficulty: "easy",
      status: "idle",
      mistakes: {},
      moveHistory: [],

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      startNewGame: (difficulty) => {
        const puzzle = generatePuzzle(difficulty);
        set({
          puzzle,
          userGrid: cloneGrid(puzzle.givens),
          selectedCell: null,
          difficulty,
          status: "playing",
          mistakes: {},
          moveHistory: []
        });
      },

      restartGame: () => {
        const { puzzle } = get();
        if (!puzzle) {
          return;
        }

        set({
          userGrid: cloneGrid(puzzle.givens),
          selectedCell: null,
          status: "playing",
          mistakes: {},
          moveHistory: []
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
        const { puzzle, selectedCell, userGrid } = get();
        if (!puzzle || !selectedCell || !userGrid) {
          return;
        }

        if (puzzle.givens[selectedCell.row][selectedCell.col] !== 0) {
          return;
        }

        const currentValue = userGrid[selectedCell.row][selectedCell.col];
        if (currentValue === value) {
          return;
        }

        const nextGrid = cloneGrid(userGrid);
        nextGrid[selectedCell.row][selectedCell.col] = value;

        const mistakeKey = keyForCell(selectedCell);
        const mistakes = { ...get().mistakes };
        const isMistake = puzzle.solution[selectedCell.row][selectedCell.col] !== value;

        if (isMistake) {
          mistakes[mistakeKey] = true;
        } else {
          delete mistakes[mistakeKey];
        }

        set({
          userGrid: nextGrid,
          mistakes,
          status: isPuzzleCompleted(nextGrid, puzzle.solution) ? "completed" : "playing",
          moveHistory: [
            ...get().moveHistory,
            {
              userGrid: cloneGrid(userGrid),
              selectedCell,
              status: get().status,
              mistakes: { ...get().mistakes }
            }
          ]
        });
      },

      clearSelectedCell: () => {
        const { puzzle, selectedCell, userGrid } = get();
        if (!puzzle || !selectedCell || !userGrid) {
          return;
        }

        if (puzzle.givens[selectedCell.row][selectedCell.col] !== 0) {
          return;
        }

        if (userGrid[selectedCell.row][selectedCell.col] === 0) {
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
              selectedCell,
              status: get().status,
              mistakes: { ...get().mistakes }
            }
          ]
        });
      },

      undoLastMove: () => {
        const { moveHistory } = get();
        const previous = moveHistory[moveHistory.length - 1];
        if (!previous) {
          return;
        }

        set({
          userGrid: cloneGrid(previous.userGrid),
          selectedCell: previous.selectedCell,
          status: previous.status,
          mistakes: { ...previous.mistakes },
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
        selectedCell: state.selectedCell,
        difficulty: state.difficulty,
        status: state.status,
        mistakes: state.mistakes,
        moveHistory: state.moveHistory
      })
    }
  )
);
