import {
  BOX_SIZE,
  EMPTY_CELL,
  FilledCellValue,
  GRID_SIZE,
  PuzzleRating,
  RatingStep,
  SudokuGrid,
  Technique
} from "./types";
import { ALL_VALUES_MASK, boxIndex, candidateMask, maskSize, valueBit } from "./masks";
import { cloneGrid, isValidGridShape } from "./validator";

type UnitType = "row" | "col" | "box";
type CellRef = {
  row: number;
  col: number;
  box: number;
};
type Unit = {
  type: UnitType;
  cells: CellRef[];
};
type RatingState = {
  grid: SudokuGrid;
  candidates: number[][];
  rowMasks: number[];
  colMasks: number[];
  boxMasks: number[];
  emptyCount: number;
};

const values: FilledCellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const techniqueRank: Record<Technique, number> = {
  nakedSingle: 1,
  hiddenSingle: 2,
  lockedCandidates: 3,
  nakedPair: 4,
  hiddenPair: 5
};

const techniqueScore: Record<Technique, number> = {
  nakedSingle: 1,
  hiddenSingle: 2,
  lockedCandidates: 6,
  nakedPair: 8,
  hiddenPair: 10
};

const units = buildUnits();
const lineUnits = units.filter((unit) => unit.type === "row" || unit.type === "col");
const boxUnits = units.filter((unit) => unit.type === "box");

function firstValue(mask: number): FilledCellValue {
  for (const value of values) {
    if (mask & valueBit(value)) {
      return value;
    }
  }

  throw new Error("Expected candidate value");
}

function buildUnits(): Unit[] {
  const result: Unit[] = [];

  for (let index = 0; index < GRID_SIZE; index += 1) {
    const rowCells: CellRef[] = [];
    const colCells: CellRef[] = [];

    for (let offset = 0; offset < GRID_SIZE; offset += 1) {
      rowCells.push({ row: index, col: offset, box: boxIndex(index, offset) });
      colCells.push({ row: offset, col: index, box: boxIndex(offset, index) });
    }

    result.push({ type: "row", cells: rowCells });
    result.push({ type: "col", cells: colCells });
  }

  for (let boxRow = 0; boxRow < GRID_SIZE; boxRow += BOX_SIZE) {
    for (let boxCol = 0; boxCol < GRID_SIZE; boxCol += BOX_SIZE) {
      const boxCells: CellRef[] = [];

      for (let row = boxRow; row < boxRow + BOX_SIZE; row += 1) {
        for (let col = boxCol; col < boxCol + BOX_SIZE; col += 1) {
          boxCells.push({ row, col, box: boxIndex(row, col) });
        }
      }

      result.push({ type: "box", cells: boxCells });
    }
  }

  return result;
}

function buildRatingState(grid: SudokuGrid): RatingState | null {
  const candidates = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 0)
  );
  const rowMasks = Array.from({ length: GRID_SIZE }, () => 0);
  const colMasks = Array.from({ length: GRID_SIZE }, () => 0);
  const boxMasks = Array.from({ length: GRID_SIZE }, () => 0);
  let emptyCount = 0;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const value = grid[row][col];

      if (value === EMPTY_CELL) {
        emptyCount += 1;
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

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] !== EMPTY_CELL) {
        continue;
      }

      candidates[row][col] = candidateMask(rowMasks, colMasks, boxMasks, row, col);
    }
  }

  return { grid, candidates, rowMasks, colMasks, boxMasks, emptyCount };
}

function hasEmptyCellWithNoCandidates(grid: SudokuGrid, candidates: number[][]): boolean {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] === EMPTY_CELL && candidates[row][col] === 0) {
        return true;
      }
    }
  }

  return false;
}

function placeValue(
  state: RatingState,
  steps: RatingStep[],
  technique: Technique,
  row: number,
  col: number,
  value: FilledCellValue,
  unit?: UnitType
): void {
  const { grid, candidates, rowMasks, colMasks, boxMasks } = state;
  const bit = valueBit(value);
  const box = boxIndex(row, col);

  grid[row][col] = value;
  candidates[row][col] = 0;
  rowMasks[row] |= bit;
  colMasks[col] |= bit;
  boxMasks[box] |= bit;
  state.emptyCount -= 1;

  for (let index = 0; index < GRID_SIZE; index += 1) {
    candidates[row][index] &= ~bit;
    candidates[index][col] &= ~bit;
  }

  const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let boxRow = startRow; boxRow < startRow + BOX_SIZE; boxRow += 1) {
    for (let boxCol = startCol; boxCol < startCol + BOX_SIZE; boxCol += 1) {
      candidates[boxRow][boxCol] &= ~bit;
    }
  }

  steps.push({ technique, row, col, value, unit });
}

function applyNakedSingle(state: RatingState, steps: RatingStep[]): boolean {
  const { grid, candidates } = state;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const mask = candidates[row][col];

      if (grid[row][col] === EMPTY_CELL && maskSize(mask) === 1) {
        placeValue(state, steps, "nakedSingle", row, col, firstValue(mask));
        return true;
      }
    }
  }

  return false;
}

function applyHiddenSingle(state: RatingState, steps: RatingStep[]): boolean {
  const { grid, candidates } = state;

  for (const unit of units) {
    for (const value of values) {
      const bit = valueBit(value);
      let match: CellRef | null = null;
      let matches = 0;

      for (const cell of unit.cells) {
        if (grid[cell.row][cell.col] === EMPTY_CELL && (candidates[cell.row][cell.col] & bit)) {
          match = cell;
          matches += 1;
          if (matches > 1) {
            break;
          }
        }
      }

      if (matches === 1 && match) {
        placeValue(
          state,
          steps,
          "hiddenSingle",
          match.row,
          match.col,
          value,
          unit.type
        );
        return true;
      }
    }
  }

  return false;
}

function applyLockedCandidates(
  grid: SudokuGrid,
  candidates: number[][],
  steps: RatingStep[]
): boolean {
  for (const unit of lineUnits) {
    for (const value of values) {
      const bit = valueBit(value);
      const matches: CellRef[] = [];
      let matchBox: number | null = null;

      for (const cell of unit.cells) {
        if (grid[cell.row][cell.col] !== EMPTY_CELL || !(candidates[cell.row][cell.col] & bit)) {
          continue;
        }

        if (matchBox !== null && matchBox !== cell.box) {
          matches.length = 0;
          break;
        }

        matchBox = cell.box;
        matches.push(cell);
      }

      if (matches.length < 2 || matchBox === null) {
        continue;
      }

      const startRow = Math.floor(matches[0].row / BOX_SIZE) * BOX_SIZE;
      const startCol = Math.floor(matches[0].col / BOX_SIZE) * BOX_SIZE;
      let eliminated = 0;
      let stepCell: CellRef | null = null;

      for (let row = startRow; row < startRow + BOX_SIZE; row += 1) {
        for (let col = startCol; col < startCol + BOX_SIZE; col += 1) {
          const isInSourceUnit = unit.type === "row" ? row === matches[0].row : col === matches[0].col;

          if (!isInSourceUnit && (candidates[row][col] & bit)) {
            candidates[row][col] &= ~bit;
            eliminated += 1;
            stepCell = { row, col, box: matchBox };
          }
        }
      }

      if (eliminated > 0 && stepCell) {
        steps.push({
          technique: "lockedCandidates",
          row: stepCell.row,
          col: stepCell.col,
          value,
          unit: unit.type,
          eliminated
        });
        return true;
      }
    }
  }

  for (const unit of boxUnits) {
    for (const value of values) {
      const bit = valueBit(value);
      const matches: CellRef[] = [];
      let rowMatch: number | null = null;
      let colMatch: number | null = null;

      for (const cell of unit.cells) {
        if (grid[cell.row][cell.col] !== EMPTY_CELL || !(candidates[cell.row][cell.col] & bit)) {
          continue;
        }

        rowMatch = rowMatch === null || rowMatch === cell.row ? cell.row : -1;
        colMatch = colMatch === null || colMatch === cell.col ? cell.col : -1;
        matches.push(cell);
      }

      if (matches.length < 2) {
        continue;
      }

      const targetType: UnitType | null =
        rowMatch !== null && rowMatch >= 0 ? "row" : colMatch !== null && colMatch >= 0 ? "col" : null;

      if (!targetType) {
        continue;
      }

      const targetIndex = targetType === "row" ? matches[0].row : matches[0].col;
      let eliminated = 0;
      let stepCell: CellRef | null = null;

      for (let index = 0; index < GRID_SIZE; index += 1) {
        const row = targetType === "row" ? targetIndex : index;
        const col = targetType === "row" ? index : targetIndex;
        const isInBox = boxIndex(row, col) === matches[0].box;

        if (!isInBox && (candidates[row][col] & bit)) {
          candidates[row][col] &= ~bit;
          eliminated += 1;
          stepCell = { row, col, box: boxIndex(row, col) };
        }
      }

      if (eliminated > 0 && stepCell) {
        steps.push({
          technique: "lockedCandidates",
          row: stepCell.row,
          col: stepCell.col,
          value,
          unit: "box",
          eliminated
        });
        return true;
      }
    }
  }

  return false;
}

function applyNakedPair(grid: SudokuGrid, candidates: number[][], steps: RatingStep[]): boolean {
  for (const unit of units) {
    const pairCells = new Map<number, CellRef[]>();

    for (const cell of unit.cells) {
      if (grid[cell.row][cell.col] !== EMPTY_CELL) {
        continue;
      }

      const mask = candidates[cell.row][cell.col];
      if (maskSize(mask) !== 2) {
        continue;
      }

      pairCells.set(mask, [...(pairCells.get(mask) ?? []), cell]);
    }

    for (const [mask, cells] of pairCells) {
      if (cells.length !== 2) {
        continue;
      }

      let eliminated = 0;
      let stepCell: CellRef | null = null;

      for (const cell of unit.cells) {
        const isPairCell =
          (cell.row === cells[0].row && cell.col === cells[0].col) ||
          (cell.row === cells[1].row && cell.col === cells[1].col);

        if (isPairCell) {
          continue;
        }

        const before = candidates[cell.row][cell.col];
        const next = before & ~mask;

        if (next !== before) {
          candidates[cell.row][cell.col] = next;
          eliminated += maskSize(before & mask);
          stepCell = cell;
        }
      }

      if (eliminated > 0 && stepCell) {
        steps.push({
          technique: "nakedPair",
          row: stepCell.row,
          col: stepCell.col,
          unit: unit.type,
          eliminated
        });
        return true;
      }
    }
  }

  return false;
}

function applyHiddenPair(grid: SudokuGrid, candidates: number[][], steps: RatingStep[]): boolean {
  for (const unit of units) {
    for (let first = 0; first < values.length - 1; first += 1) {
      for (let second = first + 1; second < values.length; second += 1) {
        const firstValue = values[first];
        const secondValue = values[second];
        const firstBit = valueBit(firstValue);
        const secondBit = valueBit(secondValue);
        const firstCells: CellRef[] = [];
        const secondCells: CellRef[] = [];

        for (const cell of unit.cells) {
          if (grid[cell.row][cell.col] !== EMPTY_CELL) {
            continue;
          }

          const mask = candidates[cell.row][cell.col];
          if (mask & firstBit) {
            firstCells.push(cell);
          }
          if (mask & secondBit) {
            secondCells.push(cell);
          }
        }

        if (
          firstCells.length !== 2 ||
          secondCells.length !== 2 ||
          firstCells[0].row !== secondCells[0].row ||
          firstCells[0].col !== secondCells[0].col ||
          firstCells[1].row !== secondCells[1].row ||
          firstCells[1].col !== secondCells[1].col
        ) {
          continue;
        }

        const pairMask = firstBit | secondBit;
        let eliminated = 0;
        let stepCell: CellRef | null = null;

        for (const cell of firstCells) {
          const before = candidates[cell.row][cell.col];
          const next = before & pairMask;

          if (next !== before) {
            candidates[cell.row][cell.col] = next;
            eliminated += maskSize(before & ~pairMask & ALL_VALUES_MASK);
            stepCell = cell;
          }
        }

        if (eliminated > 0 && stepCell) {
          steps.push({
            technique: "hiddenPair",
            row: stepCell.row,
            col: stepCell.col,
            unit: unit.type,
            eliminated
          });
          return true;
        }
      }
    }
  }

  return false;
}

function calculateScore(steps: RatingStep[]): number {
  return steps.reduce(
    (total, step) => total + techniqueScore[step.technique] + (step.eliminated ?? 0),
    0
  );
}

function calculateMaxTechnique(steps: RatingStep[]): Technique | null {
  return steps.reduce<Technique | null>((maxTechnique, step) => {
    if (!maxTechnique || techniqueRank[step.technique] > techniqueRank[maxTechnique]) {
      return step.technique;
    }

    return maxTechnique;
  }, null);
}

export function ratePuzzle(givens: SudokuGrid): PuzzleRating {
  if (!isValidGridShape(givens)) {
    return { solved: false, score: 0, maxTechnique: null, steps: [] };
  }

  const state = buildRatingState(cloneGrid(givens));

  if (!state) {
    return { solved: false, score: 0, maxTechnique: null, steps: [] };
  }

  const steps: RatingStep[] = [];

  while (state.emptyCount > 0) {
    if (hasEmptyCellWithNoCandidates(state.grid, state.candidates)) {
      break;
    }

    const progressed =
      applyNakedSingle(state, steps) ||
      applyHiddenSingle(state, steps) ||
      applyLockedCandidates(state.grid, state.candidates, steps) ||
      applyNakedPair(state.grid, state.candidates, steps) ||
      applyHiddenPair(state.grid, state.candidates, steps);

    if (!progressed) {
      break;
    }
  }

  return {
    solved: state.emptyCount === 0,
    score: calculateScore(steps),
    maxTechnique: calculateMaxTechnique(steps),
    steps
  };
}

export function compareTechnique(left: Technique | null, right: Technique | null): number {
  return (left ? techniqueRank[left] : 0) - (right ? techniqueRank[right] : 0);
}
