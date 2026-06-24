jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

let mockParams: { game?: string } = {};

jest.mock("expo-router", () => {
  const Stack = () => null;
  Stack.Screen = () => null;

  return {
    Stack,
    router: {
      replace: jest.fn()
    },
    useLocalSearchParams: () => mockParams
  };
});

jest.mock("@/audio/SoundProvider", () => ({
  useSound: () => ({
    playUiClick: jest.fn()
  })
}));

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";

import SharedGameScreen from "@/app/share";
import {
  createSharedGamePayload,
  encodeSharedGamePayload
} from "@/features/sharing/sharedGame";
import { useGameStore } from "@/store/gameStore";

describe("shared game confirmation screen", () => {
  beforeEach(() => {
    jest.mocked(router.replace).mockClear();
    useGameStore.getState().startNewGame("easy");
    useGameStore.setState({ hasHydrated: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not replace an active game before explicit confirmation", () => {
    const sharedGivens = useGameStore.getState().puzzle!.givens;
    mockParams = {
      game: encodeSharedGamePayload(
        createSharedGamePayload("expert", false, sharedGivens)
      )
    };
    useGameStore.getState().startNewGame("medium");
    const localPuzzle = useGameStore.getState().puzzle;
    const screen = render(React.createElement(SharedGameScreen));

    expect(useGameStore.getState().puzzle).toBe(localPuzzle);
    fireEvent.press(screen.getByText("Start Game"));

    expect(screen.getByText("Replace current game?")).toBeTruthy();
    expect(useGameStore.getState().puzzle).toBe(localPuzzle);

    fireEvent.press(screen.getByText("Replace"));

    expect(useGameStore.getState().puzzle?.givens).toEqual(sharedGivens);
    expect(useGameStore.getState().difficulty).toBe("expert");
    expect(useGameStore.getState().arcadeModeEnabled).toBe(false);
    expect(router.replace).toHaveBeenCalledWith("/game");
  });

  it("keeps the active game when replacement is cancelled", () => {
    const sharedGivens = useGameStore.getState().puzzle!.givens;
    mockParams = {
      game: encodeSharedGamePayload(
        createSharedGamePayload("expert", false, sharedGivens)
      )
    };
    useGameStore.getState().startNewGame("medium");
    const localPuzzle = useGameStore.getState().puzzle;
    const screen = render(React.createElement(SharedGameScreen));

    fireEvent.press(screen.getByText("Start Game"));
    fireEvent.press(screen.getByText("Cancel"));

    expect(screen.queryByText("Replace current game?")).toBeNull();
    expect(useGameStore.getState().puzzle).toBe(localPuzzle);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows only cancel for invalid payloads", () => {
    mockParams = { game: "not-a-game" };
    const screen = render(React.createElement(SharedGameScreen));

    expect(screen.getByText("Shared Sudoku")).toBeTruthy();
    expect(screen.queryByText("Start Game")).toBeNull();
    expect(screen.getByText("EXIT")).toBeTruthy();
    expect(screen.getByText("Shared Sudoku link is invalid.")).toBeTruthy();
  });
});
