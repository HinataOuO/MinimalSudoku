import { cloneGrid, canPlaceValue, isValidGridShape } from "./validator";
import { CellValue, EMPTY_CELL, GRID_SIZE, SudokuGrid } from "./types";

function findEmptyCell(grid: SudokuGrid): [number, number] | null {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] === EMPTY_CELL) {
        return [row, col];
      }
    }
  }

  return null;
}

function shuffledNumbers(): CellValue[] {
  const values: CellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }

  return values;
}

export function solveSudoku(grid: SudokuGrid, randomize = false): SudokuGrid | null {
  if (!isValidGridShape(grid)) {
    return null;
  }

  const working = cloneGrid(grid);

  function backtrack(): boolean {
    const empty = findEmptyCell(working);
    if (!empty) {
      return true;
    }

    const [row, col] = empty;
    const candidates: CellValue[] = randomize
      ? shuffledNumbers()
      : [1, 2, 3, 4, 5, 6, 7, 8, 9];

    for (const value of candidates) {
      if (canPlaceValue(working, row, col, value)) {
        working[row][col] = value;

        if (backtrack()) {
          return true;
        }

        working[row][col] = EMPTY_CELL;
      }
    }

    return false;
  }

  return backtrack() ? working : null;
}

export function countSolutions(grid: SudokuGrid, limit = 2): number {
  if (!isValidGridShape(grid)) {
    return 0;
  }

  const working = cloneGrid(grid);
  let count = 0;

  function backtrack(): void {
    if (count >= limit) {
      return;
    }

    const empty = findEmptyCell(working);
    if (!empty) {
      count += 1;
      return;
    }

    const [row, col] = empty;

    for (let value = 1; value <= 9; value += 1) {
      const cellValue = value as CellValue;
      if (canPlaceValue(working, row, col, cellValue)) {
        working[row][col] = cellValue;
        backtrack();
        working[row][col] = EMPTY_CELL;
      }
    }
  }

  backtrack();
  return count;
}

export function hasUniqueSolution(grid: SudokuGrid): boolean {
  return countSolutions(grid, 2) === 1;
}
