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

function findFixedCell(grid: SudokuGrid): CellPosition {
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] !== 0) {
        return { row, col };
      }
    }
  }

  throw new Error("Expected generated puzzle to have a fixed cell");
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

function notesAt(cell: CellPosition) {
  return useGameStore.getState().noteGrid[cell.row][cell.col];
}

function wrongValueFor(
  solution: SudokuGrid,
  cell: CellPosition,
  excludedValues: FilledCellValue[] = []
): FilledCellValue {
  const correct = valueAt(solution, cell);
  const value = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as FilledCellValue[]).find(
    (candidate) => candidate !== correct && !excludedValues.includes(candidate)
  );

  if (!value) {
    throw new Error("Expected to find a wrong value");
  }

  return value;
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

  it("keeps mistake count when undoing a wrong value", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(wrongValueFor(puzzle!.solution, cell));
    expect(useGameStore.getState().mistakes[`${cell.row}-${cell.col}`]).toBe(true);

    useGameStore.getState().undoLastMove();

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(0);
    expect(useGameStore.getState().mistakes[`${cell.row}-${cell.col}`]).toBeUndefined();
    expect(useGameStore.getState().mistakeCount).toBe(1);
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
    expect(useGameStore.getState().mistakeCount).toBe(0);
  });

  it("does not reduce accumulated mistakes when undoing later moves", () => {
    const { puzzle } = useGameStore.getState();
    const [firstCell, secondCell] = findTwoEditableCells(puzzle!.givens);
    const firstWrongValue = wrongValueFor(puzzle!.solution, firstCell);
    const secondWrongValue = wrongValueFor(puzzle!.solution, secondCell);

    useGameStore.getState().selectCell(firstCell);
    useGameStore.getState().setCellValue(firstWrongValue);
    useGameStore.getState().selectCell(secondCell);
    useGameStore.getState().setCellValue(secondWrongValue);

    expect(useGameStore.getState().mistakeCount).toBe(2);

    useGameStore.getState().undoLastMove();

    expect(valueAt(useGameStore.getState().userGrid!, secondCell)).toBe(0);
    expect(useGameStore.getState().mistakeCount).toBe(2);
    expect(useGameStore.getState().status).toBe("playing");
  });

  it("does not undo after the game is lost", () => {
    const { puzzle } = useGameStore.getState();
    const [firstCell, secondCell] = findTwoEditableCells(puzzle!.givens);
    const firstWrongValue = wrongValueFor(puzzle!.solution, firstCell);
    const finalWrongValue = wrongValueFor(puzzle!.solution, firstCell, [firstWrongValue]);

    useGameStore.getState().selectCell(firstCell);
    useGameStore.getState().setCellValue(firstWrongValue);
    useGameStore.getState().selectCell(secondCell);
    useGameStore.getState().setCellValue(wrongValueFor(puzzle!.solution, secondCell));
    useGameStore.getState().selectCell(firstCell);
    useGameStore.getState().setCellValue(finalWrongValue);

    expect(useGameStore.getState().status).toBe("lost");
    expect(useGameStore.getState().mistakeCount).toBe(3);
    expect(valueAt(useGameStore.getState().userGrid!, firstCell)).toBe(finalWrongValue);
    const historyLength = useGameStore.getState().moveHistory.length;

    useGameStore.getState().undoLastMove();

    expect(useGameStore.getState().status).toBe("lost");
    expect(useGameStore.getState().mistakeCount).toBe(3);
    expect(valueAt(useGameStore.getState().userGrid!, firstCell)).toBe(finalWrongValue);
    expect(useGameStore.getState().moveHistory).toHaveLength(historyLength);
  });
});

describe("game store notes", () => {
  beforeEach(() => {
    useGameStore.getState().startNewGame("easy");
  });

  it("toggles multiple notes on an empty editable cell", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(3);
    useGameStore.getState().setCellValue(7);

    expect(notesAt(cell)).toEqual([3, 7]);
    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(0);
  });

  it("removes a note when entering the same note again", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(4);
    useGameStore.getState().setCellValue(4);

    expect(notesAt(cell)).toEqual([]);
  });

  it("does not count wrong notes as mistakes", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(wrongValueFor(puzzle!.solution, cell));

    expect(useGameStore.getState().mistakeCount).toBe(0);
    expect(useGameStore.getState().mistakes[`${cell.row}-${cell.col}`]).toBeUndefined();
    expect(useGameStore.getState().status).toBe("playing");
  });

  it("does not complete the puzzle when the final missing value is entered as a note", () => {
    const { puzzle } = useGameStore.getState();
    let lastCell: CellPosition | null = null;

    for (let row = 0; row < puzzle!.givens.length; row += 1) {
      for (let col = 0; col < puzzle!.givens[row].length; col += 1) {
        if (puzzle!.givens[row][col] === 0) {
          const cell = { row, col };
          if (lastCell) {
            useGameStore.getState().selectCell(lastCell);
            useGameStore
              .getState()
              .setCellValue(puzzle!.solution[lastCell.row][lastCell.col] as FilledCellValue);
          }
          lastCell = cell;
        }
      }
    }

    useGameStore.getState().selectCell(lastCell!);
    useGameStore.getState().toggleNoteMode();
    useGameStore
      .getState()
      .setCellValue(puzzle!.solution[lastCell!.row][lastCell!.col] as FilledCellValue);

    expect(valueAt(useGameStore.getState().userGrid!, lastCell!)).toBe(0);
    expect(useGameStore.getState().status).toBe("playing");
  });

  it("clears notes when inserting a final value", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const value = valueAt(puzzle!.solution, cell) as FilledCellValue;

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(1);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(value);

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(value);
    expect(notesAt(cell)).toEqual([]);
  });

  it("clears only notes with the eraser", () => {
    const { puzzle } = useGameStore.getState();
    const [noteCell, mistakeCell] = findTwoEditableCells(puzzle!.givens);

    useGameStore.getState().selectCell(mistakeCell);
    useGameStore.getState().setCellValue(wrongValueFor(puzzle!.solution, mistakeCell));
    useGameStore.getState().selectCell(noteCell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(2);
    useGameStore.getState().setCellValue(8);
    useGameStore.getState().clearSelectedCellNotes();

    expect(notesAt(noteCell)).toEqual([]);
    expect(valueAt(useGameStore.getState().userGrid!, mistakeCell)).not.toBe(0);
    expect(useGameStore.getState().mistakes[`${mistakeCell.row}-${mistakeCell.col}`]).toBe(true);
    expect(useGameStore.getState().mistakeCount).toBe(1);
  });

  it("does not add or clear notes on fixed cells", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findFixedCell(puzzle!.givens);
    const noteGrid = useGameStore.getState().noteGrid.map((row) =>
      row.map((notes) => [...notes])
    );
    noteGrid[cell.row][cell.col] = [1, 2];

    useGameStore.setState({ noteGrid });
    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(3);
    useGameStore.getState().clearSelectedCellNotes();

    expect(notesAt(cell)).toEqual([1, 2]);
  });

  it("clears notes and exits note mode when starting or restarting games", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(5);
    useGameStore.getState().restartGame();

    expect(notesAt(cell)).toEqual([]);
    expect(useGameStore.getState().isNoteMode).toBe(false);

    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().startNewGame("medium");

    expect(useGameStore.getState().noteGrid.flat(2)).toEqual([]);
    expect(useGameStore.getState().isNoteMode).toBe(false);
  });

  it("restores notes when undoing a final value", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const value = valueAt(puzzle!.solution, cell) as FilledCellValue;

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(1);
    useGameStore.getState().setCellValue(9);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(value);

    useGameStore.getState().undoLastMove();

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(0);
    expect(notesAt(cell)).toEqual([1, 9]);
  });

  it("persists notes but not note mode", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(6);

    const partialize = (useGameStore as unknown as {
      persist: { getOptions: () => { partialize: (state: unknown) => Record<string, unknown> } };
    }).persist.getOptions().partialize;
    const persistedState = partialize(useGameStore.getState());

    expect((persistedState.noteGrid as FilledCellValue[][][])[cell.row][cell.col]).toEqual([6]);
    expect(persistedState.isNoteMode).toBeUndefined();
  });
});

describe("game store generation", () => {
  it("exposes loading state while generating async games", async () => {
    useGameStore.getState().startNewGame("easy");
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(4);

    const promise = useGameStore.getState().startNewGameAsync("easy");

    expect(useGameStore.getState().isGenerating).toBe(true);
    expect(useGameStore.getState().puzzle).toBeNull();
    expect(useGameStore.getState().noteGrid.flat(2)).toEqual([]);
    expect(useGameStore.getState().isNoteMode).toBe(false);

    await promise;

    expect(useGameStore.getState().isGenerating).toBe(false);
    expect(useGameStore.getState().generationError).toBeNull();
    expect(useGameStore.getState().puzzle).not.toBeNull();
    expect(useGameStore.getState().status).toBe("playing");
    expect(useGameStore.getState().noteGrid.flat(2)).toEqual([]);
    expect(useGameStore.getState().isNoteMode).toBe(false);
  });
});

describe("game store timer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts new games with a fresh active timer", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);

    useGameStore.getState().startNewGame("easy");

    expect(useGameStore.getState().startedAt).toBe(1_000);
    expect(useGameStore.getState().finishedAt).toBeNull();
  });

  it("restarts games with a fresh active timer", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    useGameStore.getState().startNewGame("easy");

    jest.spyOn(Date, "now").mockReturnValue(5_000);
    useGameStore.getState().restartGame();

    expect(useGameStore.getState().startedAt).toBe(5_000);
    expect(useGameStore.getState().finishedAt).toBeNull();
  });

  it("stops the timer when the game is lost", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    useGameStore.getState().startNewGame("easy");

    const { puzzle } = useGameStore.getState();
    const [firstCell, secondCell] = findTwoEditableCells(puzzle!.givens);
    const firstWrongValue = wrongValueFor(puzzle!.solution, firstCell);

    jest.spyOn(Date, "now").mockReturnValue(9_000);
    useGameStore.getState().selectCell(firstCell);
    useGameStore.getState().setCellValue(firstWrongValue);
    useGameStore.getState().selectCell(secondCell);
    useGameStore.getState().setCellValue(wrongValueFor(puzzle!.solution, secondCell));
    useGameStore.getState().selectCell(firstCell);
    useGameStore
      .getState()
      .setCellValue(wrongValueFor(puzzle!.solution, firstCell, [firstWrongValue]));

    expect(useGameStore.getState().status).toBe("lost");
    expect(useGameStore.getState().finishedAt).toBe(9_000);
  });

  it("stops the timer when the puzzle is completed", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    useGameStore.getState().startNewGame("easy");

    const { puzzle } = useGameStore.getState();

    jest.spyOn(Date, "now").mockReturnValue(12_000);
    for (let row = 0; row < puzzle!.givens.length; row += 1) {
      for (let col = 0; col < puzzle!.givens[row].length; col += 1) {
        if (puzzle!.givens[row][col] === 0) {
          useGameStore.getState().selectCell({ row, col });
          useGameStore.getState().setCellValue(puzzle!.solution[row][col] as FilledCellValue);
        }
      }
    }

    expect(useGameStore.getState().status).toBe("completed");
    expect(useGameStore.getState().finishedAt).toBe(12_000);
  });

  it("persists timer fields", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    useGameStore.getState().startNewGame("easy");
    useGameStore.getState().highlightNumber(5);

    const partialize = (useGameStore as unknown as {
      persist: { getOptions: () => { partialize: (state: unknown) => Record<string, unknown> } };
    }).persist.getOptions().partialize;
    const persistedState = partialize(useGameStore.getState());

    expect(persistedState.startedAt).toBe(1_000);
    expect(persistedState.finishedAt).toBeNull();
    expect(persistedState.highlightedNumber).toBeUndefined();
  });
});

describe("game store number highlight", () => {
  beforeEach(() => {
    useGameStore.getState().startNewGame("easy");
  });

  it("highlights and clears a number", () => {
    useGameStore.getState().highlightNumber(5);

    expect(useGameStore.getState().highlightedNumber).toBe(5);

    useGameStore.getState().clearHighlightedNumber();

    expect(useGameStore.getState().highlightedNumber).toBeNull();
  });

  it("clears highlighted number when starting a new game", () => {
    useGameStore.getState().highlightNumber(5);
    useGameStore.getState().startNewGame("medium");

    expect(useGameStore.getState().highlightedNumber).toBeNull();
  });

  it("clears highlighted number when restarting", () => {
    useGameStore.getState().highlightNumber(5);
    useGameStore.getState().restartGame();

    expect(useGameStore.getState().highlightedNumber).toBeNull();
  });

  it("clears highlighted number while generating async games", async () => {
    useGameStore.getState().highlightNumber(5);
    const promise = useGameStore.getState().startNewGameAsync("easy");

    expect(useGameStore.getState().highlightedNumber).toBeNull();

    await promise;

    expect(useGameStore.getState().highlightedNumber).toBeNull();
  });
});

describe("game store selection", () => {
  beforeEach(() => {
    useGameStore.getState().startNewGame("easy");
  });

  it("selects fixed cells", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findFixedCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);

    expect(useGameStore.getState().selectedCell).toEqual(cell);
  });

  it("does not change fixed cells when entering a value", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findFixedCell(puzzle!.givens);
    const originalValue = valueAt(puzzle!.givens, cell);
    const nextValue = (originalValue === 1 ? 2 : 1) as FilledCellValue;

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(nextValue);

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(originalValue);
    expect(useGameStore.getState().moveHistory).toHaveLength(0);
  });
});

describe("game store mistake limit", () => {
  beforeEach(() => {
    useGameStore.getState().startNewGame("easy");
  });

  it("increments mistake count for each wrong inserted value", () => {
    const { puzzle } = useGameStore.getState();
    const [firstCell, secondCell] = findTwoEditableCells(puzzle!.givens);

    useGameStore.getState().selectCell(firstCell);
    useGameStore.getState().setCellValue(wrongValueFor(puzzle!.solution, firstCell));
    useGameStore.getState().selectCell(secondCell);
    useGameStore.getState().setCellValue(wrongValueFor(puzzle!.solution, secondCell));

    expect(useGameStore.getState().mistakeCount).toBe(2);
    expect(useGameStore.getState().status).toBe("playing");
  });

  it("loses the game after three wrong inserted values", () => {
    const { puzzle } = useGameStore.getState();
    const [firstCell, secondCell] = findTwoEditableCells(puzzle!.givens);
    const firstWrongValue = wrongValueFor(puzzle!.solution, firstCell);

    useGameStore.getState().selectCell(firstCell);
    useGameStore.getState().setCellValue(firstWrongValue);
    useGameStore.getState().selectCell(secondCell);
    useGameStore.getState().setCellValue(wrongValueFor(puzzle!.solution, secondCell));
    useGameStore.getState().selectCell(firstCell);
    useGameStore
      .getState()
      .setCellValue(wrongValueFor(puzzle!.solution, firstCell, [firstWrongValue]));

    expect(useGameStore.getState().mistakeCount).toBe(3);
    expect(useGameStore.getState().status).toBe("lost");
  });

  it("does not change cells after losing", () => {
    const { puzzle } = useGameStore.getState();
    const [firstCell, secondCell] = findTwoEditableCells(puzzle!.givens);
    const correctValue = valueAt(puzzle!.solution, secondCell) as FilledCellValue;
    const firstWrongValue = wrongValueFor(puzzle!.solution, firstCell);
    const secondWrongValue = wrongValueFor(puzzle!.solution, firstCell, [firstWrongValue]);
    const thirdWrongValue = wrongValueFor(puzzle!.solution, firstCell, [
      firstWrongValue,
      secondWrongValue
    ]);

    useGameStore.getState().selectCell(firstCell);
    useGameStore.getState().setCellValue(firstWrongValue);
    useGameStore.getState().setCellValue(secondWrongValue);
    useGameStore.getState().setCellValue(thirdWrongValue);

    useGameStore.getState().selectCell(secondCell);
    useGameStore.getState().setCellValue(correctValue);

    expect(valueAt(useGameStore.getState().userGrid!, secondCell)).toBe(0);
    expect(useGameStore.getState().status).toBe("lost");
  });

  it("starts new games with a fresh mistake count", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(wrongValueFor(puzzle!.solution, cell));
    useGameStore.getState().startNewGame("medium");

    expect(useGameStore.getState().mistakeCount).toBe(0);
    expect(useGameStore.getState().status).toBe("playing");
  });
});
