import { redirectSystemPath } from "@/app/+native-intent";

describe("shared game native intent", () => {
  it("rewrites the custom scheme to the internal share route", () => {
    expect(
      redirectSystemPath({
        path: "minimalsudoku://share?game=1.e.1.payload",
        initial: false
      })
    ).toBe("/share?game=1.e.1.payload");
  });

  it("leaves unrelated links unchanged", () => {
    const path = "https://example.org/other";

    expect(redirectSystemPath({ path, initial: true })).toBe(path);
  });
});
