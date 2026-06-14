import { solveSudoku, hasUniqueSolution } from "./solver";
import { cloneGrid } from "./validator";
import { Difficulty, EMPTY_CELL, GRID_SIZE, SudokuGrid, SudokuPuzzle } from "./types";

const removalsByDifficulty: Record<Difficulty, number> = {
  easy: 36,
  medium: 44,
  hard: 50,
  expert: 56
};

function emptyGrid(): SudokuGrid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => EMPTY_CELL)
  ) as SudokuGrid;
}

function shuffledCells(): Array<[number, number]> {
  const cells: Array<[number, number]> = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      cells.push([row, col]);
    }
  }

  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cells[index], cells[swapIndex]] = [cells[swapIndex], cells[index]];
  }

  return cells;
}

export function generateSolution(): SudokuGrid {
  const solution = solveSudoku(emptyGrid(), true);

  if (!solution) {
    throw new Error("Failed to generate Sudoku solution");
  }

  return solution;
}

export function generatePuzzle(difficulty: Difficulty): SudokuPuzzle {
  const solution = generateSolution();
  const givens = cloneGrid(solution);
  const targetRemovals = removalsByDifficulty[difficulty];
  let removals = 0;

  for (const [row, col] of shuffledCells()) {
    if (removals >= targetRemovals) {
      break;
    }

    const previous = givens[row][col];
    givens[row][col] = EMPTY_CELL;

    if (hasUniqueSolution(givens)) {
      removals += 1;
    } else {
      givens[row][col] = previous;
    }
  }

  return {
    givens,
    solution,
    difficulty
  };
}
