import { formatElapsedTime } from "@/utils/format";

describe("formatElapsedTime", () => {
  it.each([
    [0, "0:00"],
    [9, "0:09"],
    [65, "1:05"],
    [600, "10:00"]
  ])("formats %i seconds as %s", (seconds, expected) => {
    expect(formatElapsedTime(seconds)).toBe(expected);
  });
});
