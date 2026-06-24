import { hasUniqueSolution, solveSudoku } from "@/features/sudoku/solver";
import {
  DIFFICULTIES,
  type Difficulty,
  type SudokuGrid
} from "@/features/sudoku/types";
import { cloneGrid, isValidGridShape } from "@/features/sudoku/validator";

import {
  SHARE_BASE_URL,
  SHARED_GAME_FORMAT_VERSION
} from "./config";

export type SharedGamePayload = {
  version: typeof SHARED_GAME_FORMAT_VERSION;
  difficulty: Difficulty;
  arcadeModeEnabled: boolean;
  givens: SudokuGrid;
};

export type SharedGameDecodeResult =
  | { ok: true; payload: SharedGamePayload }
  | { ok: false; error: string };

const difficultyCodes: Record<Difficulty, string> = {
  easy: "e",
  medium: "m",
  hard: "h",
  expert: "x"
};

const difficultiesByCode: Record<string, Difficulty> = {
  e: "easy",
  m: "medium",
  h: "hard",
  x: "expert"
};

function encodeGrid(grid: SudokuGrid): string {
  return grid.flat().join("");
}

function decodeGrid(encodedGrid: string): SudokuGrid | null {
  if (!/^[0-9]{81}$/.test(encodedGrid)) {
    return null;
  }

  return Array.from({ length: 9 }, (_, row) =>
    encodedGrid
      .slice(row * 9, row * 9 + 9)
      .split("")
      .map((value) => Number(value))
  ) as SudokuGrid;
}

export function createSharedGamePayload(
  difficulty: Difficulty,
  arcadeModeEnabled: boolean,
  givens: SudokuGrid
): SharedGamePayload {
  return {
    version: SHARED_GAME_FORMAT_VERSION,
    difficulty,
    arcadeModeEnabled,
    givens: cloneGrid(givens)
  };
}

export function validateSharedGamePayload(
  value: unknown
): SharedGameDecodeResult {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Dati partita non validi." };
  }

  const candidate = value as Partial<SharedGamePayload>;

  if (candidate.version !== SHARED_GAME_FORMAT_VERSION) {
    return { ok: false, error: "Versione condivisione non supportata." };
  }

  if (!DIFFICULTIES.includes(candidate.difficulty as Difficulty)) {
    return { ok: false, error: "Difficoltà non valida." };
  }

  if (typeof candidate.arcadeModeEnabled !== "boolean") {
    return { ok: false, error: "Modalità Arcade non valida." };
  }

  if (!candidate.givens || !isValidGridShape(candidate.givens)) {
    return { ok: false, error: "La griglia deve contenere esattamente 81 celle da 0 a 9." };
  }

  if (!hasUniqueSolution(candidate.givens)) {
    return { ok: false, error: "La griglia non ha una soluzione unica valida." };
  }

  return {
    ok: true,
    payload: {
      version: SHARED_GAME_FORMAT_VERSION,
      difficulty: candidate.difficulty as Difficulty,
      arcadeModeEnabled: candidate.arcadeModeEnabled,
      givens: cloneGrid(candidate.givens)
    }
  };
}

export function encodeSharedGamePayload(payload: SharedGamePayload): string {
  const validation = validateSharedGamePayload(payload);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const validPayload = validation.payload;
  return [
    validPayload.version,
    difficultyCodes[validPayload.difficulty],
    validPayload.arcadeModeEnabled ? "1" : "0",
    encodeGrid(validPayload.givens)
  ].join(".");
}

export function decodeSharedGamePayload(encoded: string): SharedGameDecodeResult {
  const [versionValue, difficultyCode, arcadeModeValue, encodedGrid, ...extra] =
    encoded.split(".");

  if (extra.length > 0 || !versionValue || !difficultyCode || !arcadeModeValue || !encodedGrid) {
    return { ok: false, error: "Link partita non valido." };
  }

  const version = Number(versionValue);
  if (version !== SHARED_GAME_FORMAT_VERSION) {
    return { ok: false, error: "Versione condivisione non supportata." };
  }

  const difficulty = difficultiesByCode[difficultyCode];
  if (!difficulty) {
    return { ok: false, error: "Difficoltà non valida." };
  }

  if (arcadeModeValue !== "0" && arcadeModeValue !== "1") {
    return { ok: false, error: "Modalità Arcade non valida." };
  }

  const givens = decodeGrid(encodedGrid);
  if (!givens) {
    return { ok: false, error: "La griglia deve contenere esattamente 81 celle da 0 a 9." };
  }

  return validateSharedGamePayload({
    version,
    difficulty,
    arcadeModeEnabled: arcadeModeValue === "1",
    givens
  });
}

export function buildSharedGameUrl(payload: SharedGamePayload): string {
  return `${SHARE_BASE_URL}?game=${encodeURIComponent(
    encodeSharedGamePayload(payload)
  )}`;
}

export function solveSharedGame(payload: SharedGamePayload): SudokuGrid | null {
  const validation = validateSharedGamePayload(payload);
  if (!validation.ok) {
    return null;
  }

  return solveSudoku(validation.payload.givens);
}
