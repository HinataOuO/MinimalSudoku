jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import { getHighlightedNumber, isProminentCell } from "@/components/SudokuGrid";

describe("SudokuGrid highlight priority", () => {
  it("hides the selected cell highlight while long-pressing a different number", () => {
    const selectedCell = { row: 0, col: 0 };

    expect(isProminentCell(0, 0, 3, selectedCell, 3, null)).toBe(true);
    expect(isProminentCell(0, 0, 3, selectedCell, 3, 5)).toBe(false);
    expect(isProminentCell(0, 1, 5, selectedCell, 3, 5)).toBe(true);
    expect(isProminentCell(0, 0, 3, selectedCell, 3, null)).toBe(true);
  });

  it("highlights the armed rapid input number", () => {
    const highlightedNumber = getHighlightedNumber(null, true, 5);

    expect(isProminentCell(0, 0, 5, null, 0, highlightedNumber)).toBe(true);
    expect(isProminentCell(0, 1, 3, null, 0, highlightedNumber)).toBe(false);
  });

  it("gives temporary long-press highlight priority over rapid input", () => {
    expect(getHighlightedNumber(3, true, 5)).toBe(3);
    expect(getHighlightedNumber(null, true, 5)).toBe(5);
  });

  it("does not highlight the armed number outside rapid input", () => {
    expect(getHighlightedNumber(null, false, 5)).toBeNull();
  });

  it("does not highlight a number when rapid input stays active but is disarmed", () => {
    expect(getHighlightedNumber(null, true, null)).toBeNull();
  });
});
