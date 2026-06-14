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

type GameState = {
  puzzle: SudokuPuzzle | null;
  userGrid: SudokuGrid | null;
  selectedCell: CellPosition | null;
  difficulty: Difficulty;
  status: GameStatus;
  mistakes: MistakeMap;
  startNewGame: (difficulty: Difficulty) => void;
  restartGame: () => void;
  selectCell: (cell: CellPosition) => void;
  setCellValue: (value: Exclude<CellValue, 0>) => void;
  clearSelectedCell: () => void;
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
      puzzle: null,
      userGrid: null,
      selectedCell: null,
      difficulty: "easy",
      status: "idle",
      mistakes: {},

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
          mistakes: {}
        });
      },

      selectCell: (cell) => {
        const { puzzle } = get();
        if (!puzzle || puzzle.givens[cell.row][cell.col] !== 0) {
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
          status: isPuzzleCompleted(nextGrid, puzzle.solution) ? "completed" : "playing"
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

        const nextGrid = cloneGrid(userGrid);
        nextGrid[selectedCell.row][selectedCell.col] = 0;

        const mistakes = { ...get().mistakes };
        delete mistakes[keyForCell(selectedCell)];

        set({
          userGrid: nextGrid,
          mistakes,
          status: "playing"
        });
      }
    }),
    {
      name: "minimal-sudoku-game",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        puzzle: state.puzzle,
        userGrid: state.userGrid,
        selectedCell: state.selectedCell,
        difficulty: state.difficulty,
        status: state.status,
        mistakes: state.mistakes
      })
    }
  )
);
