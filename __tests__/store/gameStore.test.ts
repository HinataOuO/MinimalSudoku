jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import { useGameStore } from "@/store/gameStore";
import { CellPosition, FilledCellValue, SudokuGrid } from "@/features/sudoku/types";

function findEditableCell(grid: SudokuGrid): CellPosition {
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === 0) {
        return { row, col };
      }
    }
  }

  throw new Error("Expected generated puzzle to have an editable cell");
}

function findTwoEditableCells(grid: SudokuGrid): [CellPosition, CellPosition] {
  const cells: CellPosition[] = [];

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === 0) {
        cells.push({ row, col });
      }
    }
  }

  if (cells.length < 2) {
    throw new Error("Expected generated puzzle to have two editable cells");
  }

  return [cells[0], cells[1]];
}

function valueAt(grid: SudokuGrid, cell: CellPosition) {
  return grid[cell.row][cell.col];
}

function wrongValueFor(solution: SudokuGrid, cell: CellPosition): FilledCellValue {
  const correct = valueAt(solution, cell);
  return (correct === 1 ? 2 : 1) as FilledCellValue;
}

describe("game store undo", () => {
  beforeEach(() => {
    useGameStore.getState().startNewGame("easy");
  });

  it("undoes the last inserted value", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const value = valueAt(puzzle!.solution, cell) as FilledCellValue;

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(value);
    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(value);

    useGameStore.getState().undoLastMove();

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(0);
    expect(useGameStore.getState().moveHistory).toHaveLength(0);
  });

  it("undoes mistakes with their error state", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(wrongValueFor(puzzle!.solution, cell));
    expect(useGameStore.getState().mistakes[`${cell.row}-${cell.col}`]).toBe(true);

    useGameStore.getState().undoLastMove();

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(0);
    expect(useGameStore.getState().mistakes[`${cell.row}-${cell.col}`]).toBeUndefined();
  });

  it("undoes one move at a time", () => {
    const { puzzle } = useGameStore.getState();
    const [firstCell, secondCell] = findTwoEditableCells(puzzle!.givens);
    const firstValue = valueAt(puzzle!.solution, firstCell) as FilledCellValue;
    const secondValue = valueAt(puzzle!.solution, secondCell) as FilledCellValue;

    useGameStore.getState().selectCell(firstCell);
    useGameStore.getState().setCellValue(firstValue);
    useGameStore.getState().selectCell(secondCell);
    useGameStore.getState().setCellValue(secondValue);

    useGameStore.getState().undoLastMove();

    expect(valueAt(useGameStore.getState().userGrid!, firstCell)).toBe(firstValue);
    expect(valueAt(useGameStore.getState().userGrid!, secondCell)).toBe(0);
    expect(useGameStore.getState().moveHistory).toHaveLength(1);
  });

  it("clears undo history when restarting", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const value = valueAt(puzzle!.solution, cell) as FilledCellValue;

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(value);
    useGameStore.getState().restartGame();

    expect(useGameStore.getState().moveHistory).toHaveLength(0);
    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(0);
  });
});
