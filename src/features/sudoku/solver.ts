import { boxIndex, candidateMask, maskSize, valueBit } from "./masks";
import { cloneGrid, isValidGridShape } from "./validator";
import { EMPTY_CELL, FilledCellValue, GRID_SIZE, SudokuGrid } from "./types";

type EmptyCell = {
  row: number;
  col: number;
  candidates: number;
};

function valuesFromMask(mask: number, randomize: boolean): FilledCellValue[] {
  const values: FilledCellValue[] = [];

  for (let value = 1; value <= 9; value += 1) {
    if (mask & valueBit(value)) {
      values.push(value as FilledCellValue);
    }
  }

  return randomize ? shuffleValues(values) : values;
}

function buildMasks(grid: SudokuGrid): {
  rowMasks: number[];
  colMasks: number[];
  boxMasks: number[];
} | null {
  const rowMasks = Array.from({ length: GRID_SIZE }, () => 0);
  const colMasks = Array.from({ length: GRID_SIZE }, () => 0);
  const boxMasks = Array.from({ length: GRID_SIZE }, () => 0);

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const value = grid[row][col];

      if (value === EMPTY_CELL) {
        continue;
      }

      const bit = valueBit(value);
      const box = boxIndex(row, col);

      if ((rowMasks[row] & bit) || (colMasks[col] & bit) || (boxMasks[box] & bit)) {
        return null;
      }

      rowMasks[row] |= bit;
      colMasks[col] |= bit;
      boxMasks[box] |= bit;
    }
  }

  return { rowMasks, colMasks, boxMasks };
}

function findBestEmptyCell(
  grid: SudokuGrid,
  rowMasks: number[],
  colMasks: number[],
  boxMasks: number[]
): EmptyCell | null {
  let best: EmptyCell | null = null;
  let bestSize = GRID_SIZE + 1;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] !== EMPTY_CELL) {
        continue;
      }

      const candidates = candidateMask(rowMasks, colMasks, boxMasks, row, col);
      const candidateCount = maskSize(candidates);

      if (!best || candidateCount < bestSize) {
        best = { row, col, candidates };
        bestSize = candidateCount;
      }

      if (candidateCount <= 1) {
        return best;
      }
    }
  }

  return best;
}

function shuffleValues<T>(values: T[]): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function solveSudoku(grid: SudokuGrid, randomize = false): SudokuGrid | null {
  if (!isValidGridShape(grid)) {
    return null;
  }

  const working = cloneGrid(grid);
  const masks = buildMasks(working);

  if (!masks) {
    return null;
  }

  const { rowMasks, colMasks, boxMasks } = masks;

  function backtrack(): boolean {
    const empty = findBestEmptyCell(working, rowMasks, colMasks, boxMasks);
    if (!empty) {
      return true;
    }

    const { row, col } = empty;
    const box = boxIndex(row, col);
    const candidates = valuesFromMask(empty.candidates, randomize);

    for (const value of candidates) {
      const bit = valueBit(value);

      working[row][col] = value;
      rowMasks[row] |= bit;
      colMasks[col] |= bit;
      boxMasks[box] |= bit;

      if (backtrack()) {
        return true;
      }

      working[row][col] = EMPTY_CELL;
      rowMasks[row] &= ~bit;
      colMasks[col] &= ~bit;
      boxMasks[box] &= ~bit;
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
  const masks = buildMasks(working);

  if (!masks) {
    return 0;
  }

  const { rowMasks, colMasks, boxMasks } = masks;
  let count = 0;

  function backtrack(): void {
    if (count >= limit) {
      return;
    }

    const empty = findBestEmptyCell(working, rowMasks, colMasks, boxMasks);
    if (!empty) {
      count += 1;
      return;
    }

    const { row, col } = empty;
    const box = boxIndex(row, col);

    for (let value = 1; value <= 9; value += 1) {
      if (!(empty.candidates & valueBit(value))) {
        continue;
      }

      const bit = valueBit(value);
      working[row][col] = value as FilledCellValue;
      rowMasks[row] |= bit;
      colMasks[col] |= bit;
      boxMasks[box] |= bit;
      backtrack();
      working[row][col] = EMPTY_CELL;
      rowMasks[row] &= ~bit;
      colMasks[col] &= ~bit;
      boxMasks[box] &= ~bit;
    }
  }

  backtrack();
  return count;
}

export function hasUniqueSolution(grid: SudokuGrid): boolean {
  return countSolutions(grid, 2) === 1;
}
