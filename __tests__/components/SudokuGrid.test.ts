jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import { isProminentCell } from "@/components/SudokuGrid";

describe("SudokuGrid highlight priority", () => {
  it("hides the selected cell highlight while long-pressing a different number", () => {
    const selectedCell = { row: 0, col: 0 };

    expect(isProminentCell(0, 0, 3, selectedCell, 3, null)).toBe(true);
    expect(isProminentCell(0, 0, 3, selectedCell, 3, 5)).toBe(false);
    expect(isProminentCell(0, 1, 5, selectedCell, 3, 5)).toBe(true);
    expect(isProminentCell(0, 0, 3, selectedCell, 3, null)).toBe(true);
  });
});
