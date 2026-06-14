import { generatePuzzle } from "@/features/sudoku/generator";
import { countSolutions, hasUniqueSolution, solveSudoku } from "@/features/sudoku/solver";
import { SudokuGrid } from "@/features/sudoku/types";
import { isSolvedGrid } from "@/features/sudoku/validator";

const puzzle: SudokuGrid = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9]
];

describe("sudoku solver", () => {
  it("solves a valid puzzle", () => {
    const solution = solveSudoku(puzzle);

    expect(solution).not.toBeNull();
    expect(isSolvedGrid(solution!)).toBe(true);
  });

  it("detects unique solution", () => {
    expect(hasUniqueSolution(puzzle)).toBe(true);
    expect(countSolutions(puzzle, 2)).toBe(1);
  });

  it("generates uniquely solvable puzzles", () => {
    const generated = generatePuzzle("easy");

    expect(isSolvedGrid(generated.solution)).toBe(true);
    expect(hasUniqueSolution(generated.givens)).toBe(true);
  });
});
