import {
  classifyRatingForDifficulty,
  generatePuzzle,
  isRatingAllowedForDifficulty
} from "@/features/sudoku/generator";
import { compareTechnique, ratePuzzle } from "@/features/sudoku/rating";
import { countSolutions, hasUniqueSolution, solveSudoku } from "@/features/sudoku/solver";
import { DIFFICULTIES, PuzzleRating, SudokuGrid } from "@/features/sudoku/types";
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

const advancedPuzzle: SudokuGrid = [
  [1, 0, 0, 0, 0, 7, 0, 9, 0],
  [0, 3, 0, 0, 2, 0, 0, 0, 8],
  [0, 0, 9, 6, 0, 0, 5, 0, 0],
  [0, 0, 5, 3, 0, 0, 9, 0, 0],
  [0, 1, 0, 0, 8, 0, 0, 0, 2],
  [6, 0, 0, 0, 0, 4, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 4, 0, 0, 0, 0, 0, 0, 7],
  [0, 0, 7, 0, 0, 0, 3, 0, 0]
];

function countClues(grid: SudokuGrid): number {
  return grid.reduce((total, row) => total + row.filter((cell) => cell !== 0).length, 0);
}

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

describe("sudoku rating", () => {
  it("solves puzzles with v1 logical techniques", () => {
    const rating = ratePuzzle(puzzle);

    expect(rating.solved).toBe(true);
    expect(rating.score).toBeGreaterThan(0);
    expect(rating.maxTechnique).not.toBeNull();
    expect(rating.steps.length).toBeGreaterThan(0);
  });

  it("leaves advanced puzzles unsolved when v1 techniques are insufficient", () => {
    const rating = ratePuzzle(advancedPuzzle);

    expect(solveSudoku(advancedPuzzle)).not.toBeNull();
    expect(rating.solved).toBe(false);
  });
});

describe("sudoku generator rating profiles", () => {
  it("classifies rating profile mismatches", () => {
    const tooEasy: PuzzleRating = {
      solved: true,
      score: 80,
      maxTechnique: "hiddenSingle",
      steps: []
    };
    const tooHard: PuzzleRating = {
      solved: false,
      score: 0,
      maxTechnique: null,
      steps: []
    };
    const allowed: PuzzleRating = {
      solved: true,
      score: 110,
      maxTechnique: "nakedPair",
      steps: []
    };

    expect(classifyRatingForDifficulty(tooEasy, "expert", 28)).toBe("tooEasy");
    expect(classifyRatingForDifficulty(tooHard, "expert", 28)).toBe("tooHard");
    expect(classifyRatingForDifficulty(allowed, "expert", 28)).toBe("allowed");
  });

  it("generates valid logically rated puzzles for each difficulty", () => {
    for (const difficulty of DIFFICULTIES) {
      const generated = generatePuzzle(difficulty);

      expect(isSolvedGrid(generated.solution)).toBe(true);
      expect(hasUniqueSolution(generated.givens)).toBe(true);
      expect(generated.rating?.solved).toBe(true);
      expect(
        isRatingAllowedForDifficulty(generated.rating!, difficulty, countClues(generated.givens))
      ).toBe(true);
    }
  });

  it("generates stable hard and expert puzzles repeatedly", () => {
    for (const difficulty of ["hard", "expert"] as const) {
      for (let index = 0; index < 10; index += 1) {
        const generated = generatePuzzle(difficulty);
        const clueCount = countClues(generated.givens);
        const rating = generated.rating ?? ratePuzzle(generated.givens);

        expect(isSolvedGrid(generated.solution)).toBe(true);
        expect(countSolutions(generated.givens, 2)).toBe(1);
        expect(rating.solved).toBe(true);
        expect(isRatingAllowedForDifficulty(rating, difficulty, clueCount)).toBe(true);

        if (difficulty === "expert") {
          expect(rating.score).toBeGreaterThanOrEqual(100);
          expect(compareTechnique(rating.maxTechnique, "nakedPair")).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
