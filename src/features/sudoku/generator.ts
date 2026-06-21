import { solveSudoku, hasUniqueSolution } from "./solver";
import { compareTechnique, ratePuzzle } from "./rating";
import { cloneGrid } from "./validator";
import {
  Difficulty,
  EMPTY_CELL,
  GRID_SIZE,
  PuzzleRating,
  SudokuGrid,
  SudokuPuzzle,
  Technique
} from "./types";

type DifficultyProfile = {
  minClues: number;
  maxClues: number;
  minScore?: number;
  maxScore?: number;
  maxTechnique: Technique;
  requiresAtLeast?: Technique;
};
export type RatingClassification = "allowed" | "tooEasy" | "tooHard" | "outOfClueRange";

const difficultyProfiles: Record<Difficulty, DifficultyProfile> = {
  easy: {
    minClues: 40,
    maxClues: 55,
    maxScore: 120,
    maxTechnique: "hiddenSingle"
  },
  medium: {
    minClues: 32,
    maxClues: 44,
    maxScore: 220,
    maxTechnique: "lockedCandidates"
  },
  hard: {
    minClues: 28,
    maxClues: 36,
    maxScore: 320,
    maxTechnique: "hiddenPair",
    requiresAtLeast: "lockedCandidates"
  },
  expert: {
    minClues: 24,
    maxClues: 32,
    minScore: 100,
    maxTechnique: "hiddenPair",
    requiresAtLeast: "nakedPair"
  }
};

const maxAttemptsByDifficulty: Record<Difficulty, number> = {
  easy: 12,
  medium: 40,
  hard: 80,
  expert: 60
};

function emptyGrid(): SudokuGrid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => EMPTY_CELL)
  ) as SudokuGrid;
}

function shuffledCells(): Array<[number, number]> {
  const cells: Array<[number, number]> = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      cells.push([row, col]);
    }
  }

  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.round(Math.random() * (cells.length -1));
    [cells[index], cells[swapIndex]] = [cells[swapIndex], cells[index]];
  }

  return cells;
}

export function generateSolution(): SudokuGrid {
  const solution = solveSudoku(emptyGrid(), true);

  if (!solution) {
    throw new Error("Failed to generate Sudoku solution");
  }

  return solution;
}

function countClues(grid: SudokuGrid): number {
  let clues = 0;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] !== EMPTY_CELL) {
        clues += 1;
      }
    }
  }

  return clues;
}

export function isRatingAllowedForDifficulty(
  rating: PuzzleRating,
  difficulty: Difficulty,
  clueCount: number
): boolean {
  return classifyRatingForDifficulty(rating, difficulty, clueCount) === "allowed";
}

export function classifyRatingForDifficulty(
  rating: PuzzleRating,
  difficulty: Difficulty,
  clueCount: number
): RatingClassification {
  const profile = difficultyProfiles[difficulty];

  if (clueCount < profile.minClues || clueCount > profile.maxClues) {
    return "outOfClueRange";
  }

  if (!rating.solved) {
    return "tooHard";
  }

  if (profile.maxScore !== undefined && rating.score > profile.maxScore) {
    return "tooHard";
  }

  if (compareTechnique(rating.maxTechnique, profile.maxTechnique) > 0) {
    return "tooHard";
  }

  if (profile.minScore !== undefined && rating.score < profile.minScore) {
    return "tooEasy";
  }

  if (
    profile.requiresAtLeast &&
    compareTechnique(rating.maxTechnique, profile.requiresAtLeast) < 0
  ) {
    return "tooEasy";
  }

  return "allowed";
}

function buildRatedPuzzle(solution: SudokuGrid, difficulty: Difficulty): SudokuPuzzle {
  const profile = difficultyProfiles[difficulty];
  const givens = cloneGrid(solution);
  let clueCount = countClues(givens);

  for (const [row, col] of shuffledCells()) {
    if (clueCount <= profile.minClues) {
      break;
    }

    const previous = givens[row][col];
    givens[row][col] = EMPTY_CELL;

    if (!hasUniqueSolution(givens)) {
      givens[row][col] = previous;
      continue;
    }

    clueCount -= 1;

    if (clueCount > profile.maxClues) {
      continue;
    }

    const rating = ratePuzzle(givens);
    const ratingClass = classifyRatingForDifficulty(rating, difficulty, clueCount);

    if (ratingClass === "allowed") {
      return {
        givens: cloneGrid(givens),
        solution,
        difficulty,
        rating
      };
    }

    if (ratingClass === "tooHard") {
      givens[row][col] = previous;
      clueCount += 1;
    }
  }

  const rating = ratePuzzle(givens);
  return {
    givens,
    solution,
    difficulty,
    rating
  };
}

export function generatePuzzle(difficulty: Difficulty): SudokuPuzzle {
  for (let attempt = 0; attempt < maxAttemptsByDifficulty[difficulty]; attempt += 1) {
    const solution = generateSolution();
    const puzzle = buildRatedPuzzle(solution, difficulty);
    const clueCount = countClues(puzzle.givens);

    if (puzzle.rating && isRatingAllowedForDifficulty(puzzle.rating, difficulty, clueCount)) {
      return puzzle;
    }
  }

  throw new Error(`Failed to generate ${difficulty} Sudoku puzzle with logical rating`);
}
