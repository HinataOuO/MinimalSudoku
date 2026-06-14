export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const EMPTY_CELL = 0;

export const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type FilledCellValue = Exclude<CellValue, 0>;
export type SudokuGrid = CellValue[][];

export type CellPosition = {
  row: number;
  col: number;
};

export type SudokuPuzzle = {
  givens: SudokuGrid;
  solution: SudokuGrid;
  difficulty: Difficulty;
};

export type GameStatus = "idle" | "playing" | "completed";
