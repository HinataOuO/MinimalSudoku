import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Platform, Pressable, Text } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { SoundProvider, useSound } from "@/audio/SoundProvider";

jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../../assets/audio/loop.mp3", () => 4, { virtual: true });

const mockSetAudioModeAsync = jest.fn().mockResolvedValue(undefined);
const mockPlayers: Array<{
  loop: boolean;
  muted: boolean;
  pause: jest.Mock;
  play: jest.Mock;
  seekTo: jest.Mock;
  volume: number;
}> = [];
let mockPlayerCallCount = 0;
const mockUseAudioPlayer = jest.fn(() => {
  const playerIndex = mockPlayerCallCount % 4;
  mockPlayerCallCount += 1;

  if (!mockPlayers[playerIndex]) {
    mockPlayers[playerIndex] = {
      loop: false,
      muted: false,
      pause: jest.fn(),
      play: jest.fn(),
      seekTo: jest.fn().mockResolvedValue(undefined),
      volume: 1,
    };
  }

  return mockPlayers[playerIndex];
});

jest.mock("expo-audio", () => ({
  setAudioModeAsync: (...args: unknown[]) => mockSetAudioModeAsync(...args),
  useAudioPlayer: () => mockUseAudioPlayer(),
}));

const audioSettingsStorageKey = "minimal-sudoku-audio-settings";

function SoundTestControls() {
  const {
    musicMuted,
    musicVolume,
    muted,
    playGameOver,
    playUiClick,
    playVictory,
    setMusicVolume,
    setVolume,
    volume,
  } = useSound();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      Text,
      { testID: "sound-state" },
      JSON.stringify({ musicMuted, musicVolume, muted, volume }),
    ),
    React.createElement(
      Pressable,
      { accessibilityLabel: "Play click", onPress: playUiClick },
      React.createElement(Text, null, "Click"),
    ),
    React.createElement(
      Pressable,
      { accessibilityLabel: "Play game over", onPress: playGameOver },
      React.createElement(Text, null, "Game over"),
    ),
    React.createElement(
      Pressable,
      { accessibilityLabel: "Play victory", onPress: playVictory },
      React.createElement(Text, null, "Victory"),
    ),
    React.createElement(
      Pressable,
      { accessibilityLabel: "Set low volume", onPress: () => setVolume(0.1) },
      React.createElement(Text, null, "Low"),
    ),
    React.createElement(
      Pressable,
      { accessibilityLabel: "Mute music", onPress: () => setMusicVolume(0) },
      React.createElement(Text, null, "Mute music"),
    ),
    React.createElement(
      Pressable,
      { accessibilityLabel: "Set music high", onPress: () => setMusicVolume(1) },
      React.createElement(Text, null, "Music high"),
    ),
  );
}

function renderSoundProvider() {
  return render(
    React.createElement(
      SoundProvider,
      null,
      React.createElement(SoundTestControls),
    ),
  );
}

describe("SoundProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "ios",
    });
    mockPlayers.length = 0;
    mockPlayerCallCount = 0;
    mockSetAudioModeAsync.mockClear();
    mockUseAudioPlayer.mockClear();
  });

  it("configures iOS audio to mix with other apps", async () => {
    renderSoundProvider();

    await waitFor(() => expect(mockSetAudioModeAsync).toHaveBeenCalledTimes(1));

    expect(mockSetAudioModeAsync).toHaveBeenCalledWith({
      allowsRecording: false,
      interruptionMode: "mixWithOthers",
      interruptionModeAndroid: "doNotMix",
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
  });

  it("does not configure audio mode on Android", async () => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "android",
    });

    renderSoundProvider();

    await waitFor(() => expect(mockUseAudioPlayer).toHaveBeenCalledTimes(4));
    expect(mockSetAudioModeAsync).not.toHaveBeenCalled();
  });

  it("loads legacy sound settings and initializes music at low volume", async () => {
    await AsyncStorage.setItem(
      audioSettingsStorageKey,
      JSON.stringify({
        musicModeEnabled: true,
        muted: false,
        volume: 0.5,
      }),
    );

    const screen = renderSoundProvider();

    await waitFor(() =>
      expect(screen.getByTestId("sound-state").props.children).toBe(
        JSON.stringify({
          musicMuted: false,
          musicVolume: 0.1,
          muted: false,
          volume: 0.5,
        }),
      ),
    );

    expect(mockPlayers.slice(0, 2).every((player) => !player.muted && player.volume === 0.5)).toBe(
      true,
    );
    expect(mockPlayers[2]).toMatchObject({
      loop: true,
      muted: false,
      volume: 0.1,
    });
    expect(mockPlayers[2].play).toHaveBeenCalled();
    expect(mockPlayers[3]).toMatchObject({ muted: false, volume: 0.5 });
  });

  it("plays all game sounds without suppressing external audio", async () => {
    const screen = renderSoundProvider();

    fireEvent.press(screen.getByLabelText("Play click"));
    fireEvent.press(screen.getByLabelText("Play game over"));
    fireEvent.press(screen.getByLabelText("Play victory"));

    await waitFor(() => {
      expect(mockPlayers[0].seekTo).toHaveBeenCalledTimes(1);
      expect(mockPlayers[1].seekTo).toHaveBeenCalledTimes(1);
      expect(mockPlayers[3].seekTo).toHaveBeenCalledTimes(1);
      expect(mockPlayers[0].play).toHaveBeenCalledTimes(1);
      expect(mockPlayers[1].play).toHaveBeenCalledTimes(1);
      expect(mockPlayers[3].play).toHaveBeenCalledTimes(1);
    });
  });

  it("persists and applies selected game volume", async () => {
    const screen = renderSoundProvider();

    fireEvent.press(screen.getByLabelText("Set low volume"));

    await waitFor(async () => {
      const storedSettings = await AsyncStorage.getItem(audioSettingsStorageKey);

      expect(JSON.parse(storedSettings ?? "{}")).toEqual({
        musicMuted: false,
        musicVolume: 0.1,
        muted: false,
        volume: 0.1,
      });
    });

    expect(mockPlayers[0]).toMatchObject({ muted: false, volume: 0.1 });
    expect(mockPlayers[1]).toMatchObject({ muted: false, volume: 0.1 });
    expect(mockPlayers[2]).toMatchObject({ muted: false, volume: 0.1 });
    expect(mockPlayers[3]).toMatchObject({ muted: false, volume: 0.1 });
  });

  it("mutes and resumes looped music without changing sound volume", async () => {
    const screen = renderSoundProvider();

    await waitFor(() => expect(mockPlayers[2].play).toHaveBeenCalled());

    fireEvent.press(screen.getByLabelText("Mute music"));

    await waitFor(() => {
      expect(mockPlayers[2]).toMatchObject({
        loop: true,
        muted: true,
        volume: 0,
      });
      expect(mockPlayers[2].pause).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByLabelText("Set music high"));

    await waitFor(async () => {
      const storedSettings = await AsyncStorage.getItem(audioSettingsStorageKey);

      expect(JSON.parse(storedSettings ?? "{}")).toEqual({
        musicMuted: false,
        musicVolume: 1,
        muted: false,
        volume: 1,
      });
    });

    expect(mockPlayers[2]).toMatchObject({
      loop: true,
      muted: false,
      volume: 1,
    });
    expect(mockPlayers[0]).toMatchObject({ muted: false, volume: 1 });
  });
});
