let mockPlayIntro: jest.Mock;

jest.mock("@/audio/SoundProvider", () => ({
  useSound: () => ({ playIntro: mockPlayIntro })
}));
jest.mock("@/theme/colors", () => ({
  useThemeColors: () => ({
    accent: "#FFB547",
    canvas: "#0A0A0A",
    ink: "#F2F2F2"
  })
}));

import React from "react";
import { act, render } from "@testing-library/react-native";

import { DeveloperSplashScreen } from "@/components/DeveloperSplashScreen";

describe("DeveloperSplashScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPlayIntro = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("shows developer logo and delays intro until sweep starts", () => {
    const onFinish = jest.fn();
    const screen = render(React.createElement(DeveloperSplashScreen, { onFinish }));

    expect(screen.getByTestId("developer-splash")).toBeTruthy();
    expect(screen.getByLabelText("Developer logo OuO")).toBeTruthy();
    expect(mockPlayIntro).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1499);
    });

    expect(mockPlayIntro).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(mockPlayIntro).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("finishes after 5 seconds", () => {
    const onFinish = jest.fn();

    render(React.createElement(DeveloperSplashScreen, { onFinish }));

    act(() => {
      jest.advanceTimersByTime(4999);
    });

    expect(onFinish).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
