import {
  buildSharedGameUrl,
  createSharedGamePayload,
  decodeSharedGamePayload,
  encodeSharedGamePayload,
  validateSharedGamePayload
} from "@/features/sharing/sharedGame";
import { type SudokuGrid } from "@/features/sudoku/types";

const uniqueGivens: SudokuGrid = [
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

describe("shared game payload", () => {
  it("round-trips compact URL-safe data", () => {
    const payload = createSharedGamePayload("hard", false, uniqueGivens);
    const encoded = encodeSharedGamePayload(payload);
    const decoded = decodeSharedGamePayload(encoded);

    expect(encoded).toMatch(/^[A-Za-z0-9.]+$/);
    expect(decoded).toEqual({ ok: true, payload });
    expect(buildSharedGameUrl(payload)).toBe(
      `minimalsudoku://share?game=${encoded}`
    );
  });

  it("rejects unsupported versions", () => {
    const encoded = encodeSharedGamePayload(
      createSharedGamePayload("easy", true, uniqueGivens)
    );

    expect(decodeSharedGamePayload(encoded.replace(/^1\./, "2."))).toEqual({
      ok: false,
      error: "Versione condivisione non supportata."
    });
  });

  it("rejects invalid difficulties", () => {
    const encoded = encodeSharedGamePayload(
      createSharedGamePayload("easy", true, uniqueGivens)
    );

    expect(decodeSharedGamePayload(encoded.replace(".e.", ".z."))).toEqual({
      ok: false,
      error: "Difficoltà non valida."
    });
  });

  it("rejects malformed grids", () => {
    expect(decodeSharedGamePayload("1.e.1.123")).toEqual({
      ok: false,
      error: "La griglia deve contenere esattamente 81 celle da 0 a 9."
    });
  });

  it("rejects contradictory or non-unique grids", () => {
    const contradictory = uniqueGivens.map((row) => [...row]) as SudokuGrid;
    contradictory[0][2] = 5;

    expect(
      validateSharedGamePayload({
        version: 1,
        difficulty: "easy",
        arcadeModeEnabled: true,
        givens: contradictory
      }).ok
    ).toBe(false);

    expect(
      validateSharedGamePayload({
        version: 1,
        difficulty: "easy",
        arcadeModeEnabled: true,
        givens: Array.from({ length: 9 }, () => Array(9).fill(0))
      }).ok
    ).toBe(false);
  });
});
