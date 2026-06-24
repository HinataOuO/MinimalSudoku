jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-router", () => {
  const React = require("react");

  const Stack = () => null;
  Stack.Screen = () => null;

  return {
    Stack,
    router: {
      replace: jest.fn()
    },
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(callback, [callback]);
    }
  };
});
jest.mock("react-native-qrcode-svg", () => () => null);
jest.mock("@/components/NumberPad", () => ({ NumberPad: () => null }));
jest.mock("@/components/SudokuGrid", () => ({ SudokuGrid: () => null }));
jest.mock("@/audio/SoundProvider", () => ({
  useSound: () => ({
    playGameOver: jest.fn(),
    playUiClick: jest.fn(),
    playVictory: jest.fn()
  })
}));

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import GameScreen from "@/app/game";
import { useGameStore } from "@/store/gameStore";

describe("game sharing overlay", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("pauses the timer while QR is visible and resumes it on close", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    useGameStore.getState().startNewGame("easy");
    useGameStore.setState({ hasHydrated: true });

    const screen = render(React.createElement(GameScreen));

    jest.spyOn(Date, "now").mockReturnValue(6_000);
    fireEvent.press(screen.getByLabelText("Condividi partita"));

    expect(useGameStore.getState().startedAt).toBeNull();
    expect(useGameStore.getState().elapsedMs).toBe(5_000);

    jest.spyOn(Date, "now").mockReturnValue(20_000);
    fireEvent.press(screen.getByLabelText("Chiudi condivisione"));

    expect(useGameStore.getState().startedAt).toBe(20_000);
    expect(useGameStore.getState().elapsedMs).toBe(5_000);
  });
});
