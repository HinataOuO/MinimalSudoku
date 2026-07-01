jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import { migrateGameStoreState, useGameStore } from "@/store/gameStore";
import { createSharedGamePayload } from "@/features/sharing/sharedGame";
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

function findOtherSolutionCell(
  solution: SudokuGrid,
  value: FilledCellValue,
  excludedCell: CellPosition
): CellPosition {
  for (let row = 0; row < solution.length; row += 1) {
    for (let col = 0; col < solution[row].length; col += 1) {
      if (
        solution[row][col] === value &&
        (row !== excludedCell.row || col !== excludedCell.col)
      ) {
        return { row, col };
      }
    }
  }

  throw new Error("Expected another solution cell for value");
}

function findEditableCellWithDifferentSolutionValue(
  givens: SudokuGrid,
  solution: SudokuGrid,
  value: FilledCellValue
): CellPosition {
  for (let row = 0; row < givens.length; row += 1) {
    for (let col = 0; col < givens[row].length; col += 1) {
      if (givens[row][col] === 0 && solution[row][col] !== value) {
        return { row, col };
      }
    }
  }

  throw new Error("Expected editable cell with a different solution value");
}

function gridWithMissingNumberCells(
  givens: SudokuGrid,
  solution: SudokuGrid,
  value: FilledCellValue,
  missingCells: CellPosition[]
): SudokuGrid {
  return solution.map((row, rowIndex) =>
    row.map((solutionValue, colIndex) => {
      if (solutionValue !== value) {
        return givens[rowIndex][colIndex];
      }

      const isMissing = missingCells.some(
        (cell) => cell.row === rowIndex && cell.col === colIndex
      );
      return isMissing ? 0 : value;
    })
  );
}

function valueAt(grid: SudokuGrid, cell: CellPosition) {
  return grid[cell.row][cell.col];
}

function notesAt(cell: CellPosition) {
  return useGameStore.getState().noteGrid[cell.row][cell.col];
}

function partializeState() {
  const partialize = (useGameStore as unknown as {
    persist: { getOptions: () => { partialize: (state: unknown) => Record<string, unknown> } };
  }).persist.getOptions().partialize;

  return partialize(useGameStore.getState());
}

function persistenceOptions() {
  return (useGameStore as unknown as {
    persist: {
      getOptions: () => {
        version?: number;
        merge?: (persistedState: unknown, currentState: unknown) => Record<string, unknown>;
      };
    };
  }).persist.getOptions();
}

function mergePersistedState(persistedState: Record<string, unknown>) {
  const merge = persistenceOptions().merge;
  if (!merge) {
    throw new Error("Expected persisted store merge option");
  }

  return merge(persistedState, useGameStore.getInitialState());
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

  it("undoes clearing a wrong value", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const value = wrongValueFor(puzzle!.solution, cell);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(value);
    useGameStore.getState().clearSelectedCell();
    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(0);

    useGameStore.getState().undoLastMove();

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(value);
    expect(useGameStore.getState().mistakes[`${cell.row}-${cell.col}`]).toBe(true);
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

  it("undoes clearing notes", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(2);
    useGameStore.getState().setCellValue(8);
    useGameStore.getState().clearSelectedCellNotes();
    expect(notesAt(cell)).toEqual([]);

    useGameStore.getState().undoLastMove();

    expect(notesAt(cell)).toEqual([2, 8]);
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

    const persistedState = partializeState();

    expect((persistedState.noteGrid as FilledCellValue[][][])[cell.row][cell.col]).toEqual([6]);
    expect(persistedState.isNoteMode).toBeUndefined();
  });
});

describe("game store arcade mode", () => {
  beforeEach(() => {
    useGameStore.getState().setArcadeModeEnabled(false);
    useGameStore.getState().startNewGame("easy");
  });

  afterEach(() => {
    useGameStore.getState().setArcadeModeEnabled(true);
  });

  it("defaults to enabled", () => {
    expect(useGameStore.getInitialState().arcadeModeEnabled).toBe(true);
  });

  it("blocks replacing a correct entered value when arcade mode is off", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const correctValue = valueAt(puzzle!.solution, cell) as FilledCellValue;
    const wrongValue = wrongValueFor(puzzle!.solution, cell);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(correctValue);
    useGameStore.getState().setCellValue(wrongValue);

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(correctValue);
    expect(useGameStore.getState().mistakeCount).toBe(0);
    expect(useGameStore.getState().moveHistory).toHaveLength(1);
  });

  it("does not clear a correct entered value when arcade mode is off", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const correctValue = valueAt(puzzle!.solution, cell) as FilledCellValue;

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(correctValue);
    useGameStore.getState().clearSelectedCell();

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(correctValue);
    expect(useGameStore.getState().moveHistory).toHaveLength(1);
  });

  it("allows replacing a wrong value when arcade mode is off", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const wrongValue = wrongValueFor(puzzle!.solution, cell);
    const correctValue = valueAt(puzzle!.solution, cell) as FilledCellValue;

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(wrongValue);
    useGameStore.getState().setCellValue(correctValue);

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(correctValue);
    expect(useGameStore.getState().mistakes[`${cell.row}-${cell.col}`]).toBeUndefined();
  });

  it("blocks replacing and clearing a correct entered value when arcade mode is on", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const correctValue = valueAt(puzzle!.solution, cell) as FilledCellValue;
    const wrongValue = wrongValueFor(puzzle!.solution, cell);

    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setCellValue(correctValue);
    useGameStore.getState().setCellValue(wrongValue);
    useGameStore.getState().clearSelectedCell();

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(correctValue);
    expect(useGameStore.getState().mistakes[`${cell.row}-${cell.col}`]).toBeUndefined();
    expect(useGameStore.getState().mistakeCount).toBe(0);
    expect(useGameStore.getState().moveHistory).toHaveLength(1);
  });

  it("persists arcade mode through the new key", () => {
    useGameStore.getState().setArcadeModeEnabled(false);

    const persistedState = partializeState();

    expect(persistedState.arcadeModeEnabled).toBe(false);
    expect(persistedState.hardModeEnabled).toBeUndefined();
    expect(persistenceOptions().version).toBe(1);
  });

  it.each([false, true])(
    "migrates legacy hard mode %s to arcade mode enabled",
    (hardModeEnabled) => {
      const migratedState = migrateGameStoreState(
        { hardModeEnabled, themeMode: "light" },
        0
      ) as Record<string, unknown>;

      expect(migratedState.arcadeModeEnabled).toBe(true);
      expect(migratedState.hardModeEnabled).toBeUndefined();
      expect(migratedState.themeMode).toBe("light");
    }
  );

  it("does not override arcade preference after migration", () => {
    const persistedState = {
      arcadeModeEnabled: false,
      themeMode: "light"
    };

    expect(migrateGameStoreState(persistedState, 1)).toEqual(
      expect.objectContaining({
        arcadeModeEnabled: false,
        themeMode: "light"
      })
    );
  });
});

describe("game store theme mode", () => {
  afterEach(() => {
    useGameStore.getState().setThemeMode("dark");
  });

  it("defaults to dark theme", () => {
    expect(useGameStore.getState().themeMode).toBe("dark");
  });

  it("toggles between dark and light theme", () => {
    useGameStore.getState().setThemeMode("dark");
    useGameStore.getState().toggleThemeMode();

    expect(useGameStore.getState().themeMode).toBe("light");

    useGameStore.getState().toggleThemeMode();

    expect(useGameStore.getState().themeMode).toBe("dark");
  });

  it("persists theme mode", () => {
    useGameStore.getState().setThemeMode("light");

    const persistedState = partializeState();

    expect(persistedState.themeMode).toBe("light");
  });
});

describe("game store persistence", () => {
  beforeEach(() => {
    useGameStore.getState().startNewGame("easy");
  });

  it("does not persist volatile UI and generation state", () => {
    useGameStore.setState({
      isGenerating: true,
      generationError: "boom"
    });
    useGameStore.getState().highlightNumber(5);
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(7);
    useGameStore.getState().toggleNoteMode();

    const persistedState = partializeState();

    expect(persistedState.isGenerating).toBeUndefined();
    expect(persistedState.generationError).toBeUndefined();
    expect(persistedState.isNoteMode).toBeUndefined();
    expect(persistedState.isRapidInputMode).toBeUndefined();
    expect(persistedState.rapidInputValue).toBeUndefined();
    expect(persistedState.highlightedNumber).toBeUndefined();
  });

  it("rehydrates progress, timer, notes, and preferences without stale volatile state", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().setThemeMode("light");
    useGameStore.getState().setArcadeModeEnabled(false);
    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(6);
    useGameStore.setState({
      elapsedMs: 12_000,
      isNoteMode: true,
      isRapidInputMode: true,
      rapidInputValue: 6,
      highlightedNumber: 6,
      isGenerating: true,
      generationError: "stale"
    });

    const mergedState = mergePersistedState(partializeState());

    expect(mergedState.puzzle).toEqual(puzzle);
    expect((mergedState.noteGrid as FilledCellValue[][][])[cell.row][cell.col]).toEqual([6]);
    expect(mergedState.selectedCell).toEqual(cell);
    expect(mergedState.elapsedMs).toBe(12_000);
    expect(mergedState.arcadeModeEnabled).toBe(false);
    expect(mergedState.themeMode).toBe("light");
    expect(mergedState.isNoteMode).toBe(false);
    expect(mergedState.isRapidInputMode).toBe(false);
    expect(mergedState.rapidInputValue).toBeNull();
    expect(mergedState.highlightedNumber).toBeNull();
    expect(mergedState.isGenerating).toBe(false);
    expect(mergedState.generationError).toBeNull();
  });

  it("migrates legacy progress while filling missing newer fields", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().setThemeMode("light");
    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(4);
    useGameStore.setState({ elapsedMs: 9_000 });

    const legacyState = {
      ...partializeState(),
      hardModeEnabled: false,
      noteGrid: undefined,
      moveHistory: undefined
    };
    const migratedState = migrateGameStoreState(legacyState, 0) as Record<string, unknown>;

    expect(migratedState.hardModeEnabled).toBeUndefined();
    expect(migratedState.arcadeModeEnabled).toBe(true);
    expect(migratedState.puzzle).toEqual(puzzle);
    expect(migratedState.userGrid).toEqual(useGameStore.getState().userGrid);
    expect(migratedState.selectedCell).toEqual(cell);
    expect(migratedState.themeMode).toBe("light");
    expect(migratedState.elapsedMs).toBe(9_000);
    expect(migratedState.noteGrid).toHaveLength(9);
    expect((migratedState.noteGrid as FilledCellValue[][][]).flat(2)).toEqual([]);
    expect(migratedState.moveHistory).toEqual([]);
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

describe("game store shared games", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("imports givens and settings while clearing local progress", () => {
    useGameStore.getState().startNewGame("easy");
    const sharedPuzzle = useGameStore.getState().puzzle!;
    const sharedPayload = createSharedGamePayload(
      "expert",
      false,
      sharedPuzzle.givens
    );
    const editableCell = findEditableCell(sharedPuzzle.givens);

    useGameStore.getState().selectCell(editableCell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(4);
    useGameStore.getState().highlightNumber(4);
    useGameStore.getState().setThemeMode("light");

    jest.spyOn(Date, "now").mockReturnValue(42_000);
    const imported = useGameStore.getState().startSharedGame(sharedPayload);
    const state = useGameStore.getState();

    expect(imported).toBe(true);
    expect(state.puzzle?.givens).toEqual(sharedPuzzle.givens);
    expect(state.puzzle?.solution).toEqual(sharedPuzzle.solution);
    expect(state.userGrid).toEqual(sharedPuzzle.givens);
    expect(state.difficulty).toBe("expert");
    expect(state.arcadeModeEnabled).toBe(false);
    expect(state.themeMode).toBe("light");
    expect(state.status).toBe("playing");
    expect(state.noteGrid.flat(2)).toEqual([]);
    expect(state.isNoteMode).toBe(false);
    expect(state.isRapidInputMode).toBe(false);
    expect(state.selectedCell).toBeNull();
    expect(state.highlightedNumber).toBeNull();
    expect(state.mistakes).toEqual({});
    expect(state.mistakeCount).toBe(0);
    expect(state.moveHistory).toEqual([]);
    expect(state.startedAt).toBe(42_000);
    expect(state.finishedAt).toBeNull();
    expect(state.elapsedMs).toBe(0);
  });

  it("does not change state for invalid shared data", () => {
    useGameStore.getState().startNewGame("easy");
    const previousPuzzle = useGameStore.getState().puzzle;

    const imported = useGameStore.getState().startSharedGame({
      version: 1,
      difficulty: "easy",
      arcadeModeEnabled: true,
      givens: Array.from({ length: 9 }, () => Array(9).fill(0))
    });

    expect(imported).toBe(false);
    expect(useGameStore.getState().puzzle).toBe(previousPuzzle);
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
    expect(useGameStore.getState().elapsedMs).toBe(0);
  });

  it("restarts games with a fresh active timer", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    useGameStore.getState().startNewGame("easy");

    jest.spyOn(Date, "now").mockReturnValue(5_000);
    useGameStore.getState().restartGame();

    expect(useGameStore.getState().startedAt).toBe(5_000);
    expect(useGameStore.getState().finishedAt).toBeNull();
    expect(useGameStore.getState().elapsedMs).toBe(0);
  });

  it("pauses and resumes the active timer without counting time away", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    useGameStore.getState().startNewGame("easy");

    jest.spyOn(Date, "now").mockReturnValue(6_000);
    useGameStore.getState().pauseTimer();

    expect(useGameStore.getState().startedAt).toBeNull();
    expect(useGameStore.getState().elapsedMs).toBe(5_000);

    jest.spyOn(Date, "now").mockReturnValue(20_000);
    useGameStore.getState().resumeTimer();

    expect(useGameStore.getState().startedAt).toBe(20_000);
    expect(useGameStore.getState().elapsedMs).toBe(5_000);

    jest.spyOn(Date, "now").mockReturnValue(24_000);
    useGameStore.getState().pauseTimer();

    expect(useGameStore.getState().startedAt).toBeNull();
    expect(useGameStore.getState().elapsedMs).toBe(9_000);
  });

  it("stops an active persisted timer on hydration without counting offline time", () => {
    useGameStore.setState({
      hasHydrated: false,
      status: "playing",
      startedAt: 1_000,
      elapsedMs: 4_000
    });

    jest.spyOn(Date, "now").mockReturnValue(100_000);
    useGameStore.getState().setHasHydrated(true);

    expect(useGameStore.getState().hasHydrated).toBe(true);
    expect(useGameStore.getState().startedAt).toBeNull();
    expect(useGameStore.getState().elapsedMs).toBe(4_000);
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
    expect(useGameStore.getState().startedAt).toBeNull();
    expect(useGameStore.getState().elapsedMs).toBe(8_000);
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
    expect(useGameStore.getState().startedAt).toBeNull();
    expect(useGameStore.getState().elapsedMs).toBe(11_000);
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
    expect(persistedState.elapsedMs).toBe(0);
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

  it("restarts transient input state without changing preferences", () => {
    useGameStore.getState().setThemeMode("light");
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(5);
    useGameStore.getState().highlightNumber(5);
    useGameStore.getState().restartGame();

    expect(useGameStore.getState().isNoteMode).toBe(false);
    expect(useGameStore.getState().isRapidInputMode).toBe(false);
    expect(useGameStore.getState().rapidInputValue).toBeNull();
    expect(useGameStore.getState().highlightedNumber).toBeNull();
    expect(useGameStore.getState().themeMode).toBe("light");
    expect(useGameStore.getState().arcadeModeEnabled).toBe(true);
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

describe("game store rapid input", () => {
  beforeEach(() => {
    useGameStore.getState().setArcadeModeEnabled(false);
    useGameStore.getState().startNewGame("easy");
  });

  afterEach(() => {
    useGameStore.getState().setArcadeModeEnabled(true);
  });

  it("enables rapid input only in arcade mode", () => {
    useGameStore.getState().toggleRapidInputMode();

    expect(useGameStore.getState().isRapidInputMode).toBe(false);

    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();

    expect(useGameStore.getState().isRapidInputMode).toBe(true);
  });

  it("arms a number without changing the selected cell", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(5);

    expect(useGameStore.getState().rapidInputValue).toBe(5);
    expect(useGameStore.getState().selectedCell).toEqual(cell);
    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(0);
  });

  it("keeps an incomplete rapid number armed after a correct insertion", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const value = valueAt(puzzle!.solution, cell) as FilledCellValue;
    const otherMissingCell = findOtherSolutionCell(puzzle!.solution, value, cell);
    const userGrid = gridWithMissingNumberCells(
      puzzle!.givens,
      puzzle!.solution,
      value,
      [cell, otherMissingCell]
    );

    useGameStore.setState({ userGrid });
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(value);
    useGameStore.getState().pressCell(cell);

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(value);
    expect(useGameStore.getState().rapidInputValue).toBe(value);
    expect(useGameStore.getState().isRapidInputMode).toBe(true);
  });

  it("disarms the rapid number after its final correct occurrence", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const value = valueAt(puzzle!.solution, cell) as FilledCellValue;
    const userGrid = gridWithMissingNumberCells(
      puzzle!.givens,
      puzzle!.solution,
      value,
      [cell]
    );

    useGameStore.setState({ userGrid });
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(value);
    useGameStore.getState().pressCell(cell);

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(value);
    expect(useGameStore.getState().rapidInputValue).toBeNull();
    expect(useGameStore.getState().isRapidInputMode).toBe(true);
  });

  it("does not disarm the rapid number after a wrong insertion", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const value = wrongValueFor(puzzle!.solution, cell);
    const missingCell = findOtherSolutionCell(puzzle!.solution, value, cell);
    const userGrid = gridWithMissingNumberCells(
      puzzle!.givens,
      puzzle!.solution,
      value,
      [missingCell]
    );

    useGameStore.setState({ userGrid });
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(value);
    useGameStore.getState().pressCell(cell);

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(value);
    expect(useGameStore.getState().rapidInputValue).toBe(value);
    expect(useGameStore.getState().isRapidInputMode).toBe(true);
  });

  it("only selects cells after the completed rapid number is disarmed", () => {
    const { puzzle } = useGameStore.getState();
    const completedCell = findEditableCell(puzzle!.givens);
    const value = valueAt(puzzle!.solution, completedCell) as FilledCellValue;
    const nextCell = findEditableCellWithDifferentSolutionValue(
      puzzle!.givens,
      puzzle!.solution,
      value
    );
    const userGrid = gridWithMissingNumberCells(
      puzzle!.givens,
      puzzle!.solution,
      value,
      [completedCell]
    );
    const nextCellValue = valueAt(userGrid, nextCell);

    useGameStore.setState({ userGrid });
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(value);
    useGameStore.getState().pressCell(completedCell);
    useGameStore.getState().pressCell(nextCell);

    expect(useGameStore.getState().rapidInputValue).toBeNull();
    expect(useGameStore.getState().selectedCell).toEqual(nextCell);
    expect(valueAt(useGameStore.getState().userGrid!, nextCell)).toBe(nextCellValue);
  });

  it("does not select or change filled cells while rapid input is armed", () => {
    const { puzzle } = useGameStore.getState();
    const fixedCell = findFixedCell(puzzle!.givens);
    const [alreadyCorrectCell, emptyCell] = findTwoEditableCells(puzzle!.givens);
    const previousCell = findEditableCellWithDifferentSolutionValue(
      puzzle!.givens,
      puzzle!.solution,
      valueAt(puzzle!.solution, alreadyCorrectCell) as FilledCellValue
    );
    const correctValue = valueAt(
      puzzle!.solution,
      alreadyCorrectCell
    ) as FilledCellValue;
    const emptyValue = valueAt(puzzle!.solution, emptyCell) as FilledCellValue;

    useGameStore.getState().selectCell(alreadyCorrectCell);
    useGameStore.getState().setCellValue(correctValue);
    useGameStore.getState().selectCell(previousCell);
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(emptyValue);
    useGameStore.getState().pressCell(fixedCell);

    expect(valueAt(useGameStore.getState().userGrid!, fixedCell)).toBe(
      valueAt(puzzle!.givens, fixedCell)
    );
    expect(useGameStore.getState().selectedCell).toEqual(previousCell);

    useGameStore.getState().pressCell(alreadyCorrectCell);

    expect(valueAt(useGameStore.getState().userGrid!, alreadyCorrectCell)).toBe(
      correctValue
    );
    expect(useGameStore.getState().selectedCell).toEqual(previousCell);

    useGameStore.getState().pressCell(emptyCell);

    expect(valueAt(useGameStore.getState().userGrid!, emptyCell)).toBe(emptyValue);
    expect(useGameStore.getState().selectedCell).toEqual(emptyCell);
    expect(useGameStore.getState().moveHistory).toHaveLength(2);
  });

  it("makes note mode and rapid input mutually exclusive", () => {
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();

    expect(useGameStore.getState().isRapidInputMode).toBe(true);
    expect(useGameStore.getState().isNoteMode).toBe(false);

    useGameStore.getState().setRapidInputValue(4);
    useGameStore.getState().toggleNoteMode();

    expect(useGameStore.getState().isNoteMode).toBe(true);
    expect(useGameStore.getState().isRapidInputMode).toBe(false);
    expect(useGameStore.getState().rapidInputValue).toBeNull();
  });

  it("clears cell notes when rapid input inserts a final value", () => {
    const { puzzle } = useGameStore.getState();
    const cell = findEditableCell(puzzle!.givens);
    const value = valueAt(puzzle!.solution, cell) as FilledCellValue;

    useGameStore.getState().selectCell(cell);
    useGameStore.getState().toggleNoteMode();
    useGameStore.getState().setCellValue(1);
    expect(notesAt(cell)).toEqual([1]);

    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(value);
    useGameStore.getState().pressCell(cell);

    expect(valueAt(useGameStore.getState().userGrid!, cell)).toBe(value);
    expect(notesAt(cell)).toEqual([]);
  });

  it("undoes rapid input and restores the previous selection", () => {
    const { puzzle } = useGameStore.getState();
    const [firstCell, secondCell] = findTwoEditableCells(puzzle!.givens);
    const value = valueAt(puzzle!.solution, secondCell) as FilledCellValue;

    useGameStore.getState().selectCell(firstCell);
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(value);
    useGameStore.getState().pressCell(secondCell);
    useGameStore.getState().undoLastMove();

    expect(valueAt(useGameStore.getState().userGrid!, secondCell)).toBe(0);
    expect(useGameStore.getState().selectedCell).toEqual(firstCell);
  });

  it("resets rapid input without persisting it", () => {
    useGameStore.getState().setArcadeModeEnabled(true);
    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(7);

    const persistedState = partializeState();
    expect(persistedState.isRapidInputMode).toBeUndefined();
    expect(persistedState.rapidInputValue).toBeUndefined();

    useGameStore.getState().restartGame();
    expect(useGameStore.getState().isRapidInputMode).toBe(false);
    expect(useGameStore.getState().rapidInputValue).toBeNull();

    useGameStore.getState().toggleRapidInputMode();
    useGameStore.getState().setRapidInputValue(7);
    useGameStore.getState().setArcadeModeEnabled(false);
    expect(useGameStore.getState().isRapidInputMode).toBe(false);
    expect(useGameStore.getState().rapidInputValue).toBeNull();
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
