jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("@/audio/SoundProvider", () => ({
  useSound: () => ({ playUiClick: jest.fn() })
}));

import { getCompletedNumberPadValues } from "@/components/NumberPad";
import { FilledCellValue, SudokuGrid, SudokuPuzzle } from "@/features/sudoku/types";

const numbers: FilledCellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const solution: SudokuGrid = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [4, 5, 6, 7, 8, 9, 1, 2, 3],
  [7, 8, 9, 1, 2, 3, 4, 5, 6],
  [2, 3, 4, 5, 6, 7, 8, 9, 1],
  [5, 6, 7, 8, 9, 1, 2, 3, 4],
  [8, 9, 1, 2, 3, 4, 5, 6, 7],
  [3, 4, 5, 6, 7, 8, 9, 1, 2],
  [6, 7, 8, 9, 1, 2, 3, 4, 5],
  [9, 1, 2, 3, 4, 5, 6, 7, 8]
];
const emptyGrid: SudokuGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
const puzzle: SudokuPuzzle = {
  givens: emptyGrid,
  solution,
  difficulty: "easy"
};
const puzzleWithCompletedGivenNumber: SudokuPuzzle = {
  givens: gridWithCompletedNumber(1),
  solution,
  difficulty: "easy"
};

function gridWithCompletedNumber(number: FilledCellValue): SudokuGrid {
  return solution.map((row) => row.map((value) => (value === number ? number : 0)));
}

describe("getCompletedNumberPadValues", () => {
  it("marks a completed number when arcade mode is on", () => {
    const completedNumbers = getCompletedNumberPadValues(
      numbers,
      puzzle,
      gridWithCompletedNumber(1),
      true
    );

    expect(completedNumbers).toContain(1);
  });

  it("does not mark an incomplete number when arcade mode is on", () => {
    const userGrid = gridWithCompletedNumber(1);
    userGrid[0][0] = 0;

    const completedNumbers = getCompletedNumberPadValues(numbers, puzzle, userGrid, true);

    expect(completedNumbers).not.toContain(1);
  });

  it("does not mark a number when any matching solution cell has a wrong value", () => {
    const userGrid = gridWithCompletedNumber(1);
    userGrid[0][0] = 2;

    const completedNumbers = getCompletedNumberPadValues(numbers, puzzle, userGrid, true);

    expect(completedNumbers).not.toContain(1);
  });

  it("marks a number completed by givens at game start", () => {
    const completedNumbers = getCompletedNumberPadValues(
      numbers,
      puzzleWithCompletedGivenNumber,
      puzzleWithCompletedGivenNumber.givens,
      true
    );

    expect(completedNumbers).toContain(1);
  });

  it("keeps a completed number available when arcade mode is off", () => {
    const completedNumbers = getCompletedNumberPadValues(
      numbers,
      puzzle,
      gridWithCompletedNumber(1),
      false
    );

    expect(completedNumbers).not.toContain(1);
  });

  it("returns no completed numbers when puzzle is missing", () => {
    expect(getCompletedNumberPadValues(numbers, null, gridWithCompletedNumber(1), false)).toEqual(
      []
    );
  });

  it("returns no completed numbers when user grid is missing", () => {
    expect(getCompletedNumberPadValues(numbers, puzzle, null, false)).toEqual([]);
  });
});
