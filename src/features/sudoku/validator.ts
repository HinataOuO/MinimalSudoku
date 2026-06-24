import {
  BOX_SIZE,
  EMPTY_CELL,
  FilledCellValue,
  GRID_SIZE,
  SudokuGrid
} from "./types";

export function cloneGrid(grid: SudokuGrid): SudokuGrid {
  return grid.map((row) => [...row]) as SudokuGrid;
}

export function isValidGridShape(grid: SudokuGrid): boolean {
  return (
    Array.isArray(grid) &&
    grid.length === GRID_SIZE &&
    grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === GRID_SIZE &&
        row.every((value) => Number.isInteger(value) && value >= 0 && value <= 9)
    )
  );
}

export function canPlaceValue(
  grid: SudokuGrid,
  row: number,
  col: number,
  value: number
): boolean {
  if (value < 1 || value > 9) {
    return false;
  }

  for (let index = 0; index < GRID_SIZE; index += 1) {
    if (index !== col && grid[row][index] === value) {
      return false;
    }
    if (index !== row && grid[index][col] === value) {
      return false;
    }
  }

  const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let r = startRow; r < startRow + BOX_SIZE; r += 1) {
    for (let c = startCol; c < startCol + BOX_SIZE; c += 1) {
      if ((r !== row || c !== col) && grid[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

export function isCompleteGrid(grid: SudokuGrid): boolean {
  return isValidGridShape(grid) && grid.every((row) => row.every((cell) => cell !== EMPTY_CELL));
}

export function isNumberCompleted(
  grid: SudokuGrid,
  solution: SudokuGrid,
  number: FilledCellValue
): boolean {
  return solution.every((row, rowIndex) =>
    row.every((solutionValue, colIndex) => {
      return solutionValue !== number || grid[rowIndex][colIndex] === number;
    })
  );
}

export function isSolvedGrid(grid: SudokuGrid): boolean {
  if (!isCompleteGrid(grid)) {
    return false;
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (!canPlaceValue(grid, row, col, grid[row][col])) {
        return false;
      }
    }
  }

  return true;
}
