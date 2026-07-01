import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Platform, Pressable, Text } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { SoundProvider, useSound } from "@/audio/SoundProvider";

jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../../assets/audio/intro.mp3", () => 3, { virtual: true });
jest.mock("../../assets/audio/loop.mp3", () => 4, { virtual: true });

const mockSetAudioModeAsync = jest.fn().mockResolvedValue(undefined);
const mockSetIsAudioActiveAsync = jest.fn().mockResolvedValue(undefined);
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
  const playerIndex = mockPlayerCallCount % 5;
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
  setIsAudioActiveAsync: (...args: unknown[]) => mockSetIsAudioActiveAsync(...args),
  useAudioPlayer: () => mockUseAudioPlayer(),
}));

const audioSettingsStorageKey = "minimal-sudoku-audio-settings";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

function SoundTestControls() {
  const {
    musicMuted,
    musicVolume,
    muted,
    playGameOver,
    playIntro,
    playUiClick,
    playVictory,
    setIntroFinished,
    setMusicVolume,
    setVolume,
    spotifyModeEnabled,
    toggleSpotifyMode,
    volume,
  } = useSound();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      Text,
      { testID: "sound-state" },
      JSON.stringify({ musicMuted, musicVolume, muted, spotifyModeEnabled, volume }),
    ),
    React.createElement(
      Pressable,
      {
        accessibilityLabel: "Toggle Spotify mode",
        accessibilityState: { selected: spotifyModeEnabled },
        onPress: toggleSpotifyMode,
      },
      React.createElement(Text, null, "Spotify"),
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
      { accessibilityLabel: "Play intro", onPress: playIntro },
      React.createElement(Text, null, "Intro"),
    ),
    React.createElement(
      Pressable,
      { accessibilityLabel: "Play victory", onPress: playVictory },
      React.createElement(Text, null, "Victory"),
    ),
    React.createElement(
      Pressable,
      { accessibilityLabel: "Finish intro", onPress: setIntroFinished },
      React.createElement(Text, null, "Finish intro"),
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

async function waitForHydratedAudio() {
  await waitFor(() => expect(mockSetIsAudioActiveAsync).toHaveBeenCalled());
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
    mockSetAudioModeAsync.mockReset();
    mockSetAudioModeAsync.mockResolvedValue(undefined);
    mockSetIsAudioActiveAsync.mockReset();
    mockSetIsAudioActiveAsync.mockResolvedValue(undefined);
    mockUseAudioPlayer.mockClear();
  });

  it("creates players while audio mode is configuring and starts music after intro finishes", async () => {
    const audioModeDeferred = createDeferred<void>();
    mockSetAudioModeAsync.mockReturnValue(audioModeDeferred.promise);

    const screen = renderSoundProvider();

    await waitFor(() => expect(mockSetAudioModeAsync).toHaveBeenCalledTimes(1));
    expect(mockPlayers).toHaveLength(5);
    expect(mockPlayers[3].play).not.toHaveBeenCalled();

    audioModeDeferred.resolve();

    await waitFor(() => expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(true));
    expect(mockPlayers[3].play).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Finish intro"));

    expect(mockPlayers[3].play).toHaveBeenCalledTimes(1);
  });

  it("defaults Spotify mode off, activates app audio, and starts looped music after intro", async () => {
    const screen = renderSoundProvider();

    await waitForHydratedAudio();

    expect(screen.getByTestId("sound-state").props.children).toBe(
      JSON.stringify({
        musicMuted: false,
        musicVolume: 0.1,
        muted: false,
        spotifyModeEnabled: false,
        volume: 1,
      }),
    );
    expect(mockSetAudioModeAsync).toHaveBeenCalledWith({
      allowsRecording: false,
      interruptionMode: "mixWithOthers",
      interruptionModeAndroid: "doNotMix",
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
    expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(true);
    expect(mockPlayers[3]).toMatchObject({
      loop: true,
      muted: true,
      volume: 0,
    });
    expect(mockPlayers[3].play).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Finish intro"));

    expect(mockPlayers[3]).toMatchObject({
      loop: true,
      muted: false,
      volume: 0.1,
    });
    expect(mockPlayers[3].play).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Toggle Spotify mode").props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it("turns Spotify mode on, deactivates app audio, pauses music, and blocks effects", async () => {
    const screen = renderSoundProvider();

    await waitForHydratedAudio();

    fireEvent.press(screen.getByLabelText("Toggle Spotify mode"));

    await waitFor(() => expect(mockSetIsAudioActiveAsync).toHaveBeenLastCalledWith(false));

    expect(screen.getByLabelText("Toggle Spotify mode").props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId("sound-state").props.children).toBe(
      JSON.stringify({
        musicMuted: false,
        musicVolume: 0.1,
        muted: false,
        spotifyModeEnabled: true,
        volume: 1,
      }),
    );
    expect(mockPlayers[3]).toMatchObject({
      loop: true,
      muted: true,
      volume: 0,
    });
    expect(mockPlayers[3].pause).toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Play click"));
    fireEvent.press(screen.getByLabelText("Play game over"));
    fireEvent.press(screen.getByLabelText("Play victory"));

    expect(mockPlayers[0].seekTo).not.toHaveBeenCalled();
    expect(mockPlayers[1].seekTo).not.toHaveBeenCalled();
    expect(mockPlayers[4].seekTo).not.toHaveBeenCalled();
  });

  it("turns Spotify mode off, reactivates app audio, reapplies volumes, and restarts music", async () => {
    await AsyncStorage.setItem(
      audioSettingsStorageKey,
      JSON.stringify({
        musicMuted: false,
        musicVolume: 0.5,
        muted: false,
        spotifyModeEnabled: true,
        volume: 0.5,
      }),
    );
    const screen = renderSoundProvider();

    await waitFor(() => expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(false));
    expect(mockPlayers[3].play).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Toggle Spotify mode"));

    await waitFor(() => expect(mockSetIsAudioActiveAsync).toHaveBeenLastCalledWith(true));
    expect(mockPlayers[3].play).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Finish intro"));

    expect(mockPlayers[0]).toMatchObject({ muted: false, volume: 0.5 });
    expect(mockPlayers[1]).toMatchObject({ muted: false, volume: 0.5 });
    expect(mockPlayers[3]).toMatchObject({
      loop: true,
      muted: false,
      volume: 0.5,
    });
    expect(mockPlayers[3].play).toHaveBeenCalledTimes(1);
    expect(mockPlayers[4]).toMatchObject({ muted: false, volume: 0.5 });
  });

  it("persists Spotify mode and loads it on next mount", async () => {
    const screen = renderSoundProvider();

    await waitForHydratedAudio();
    fireEvent.press(screen.getByLabelText("Toggle Spotify mode"));

    await waitFor(async () => {
      const storedSettings = await AsyncStorage.getItem(audioSettingsStorageKey);

      expect(JSON.parse(storedSettings ?? "{}")).toEqual({
        musicMuted: false,
        musicVolume: 0.1,
        muted: false,
        spotifyModeEnabled: true,
        volume: 1,
      });
    });

    screen.unmount();
    mockPlayers.length = 0;
    mockPlayerCallCount = 0;
    mockSetIsAudioActiveAsync.mockClear();

    const nextScreen = renderSoundProvider();

    await waitFor(() => expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(false));
    expect(nextScreen.getByLabelText("Toggle Spotify mode").props.accessibilityState).toEqual({
      selected: true,
    });
    expect(mockPlayers[3].play).not.toHaveBeenCalled();
  });

  it("keeps music stopped after intro finishes when Spotify mode is enabled", async () => {
    await AsyncStorage.setItem(
      audioSettingsStorageKey,
      JSON.stringify({
        musicMuted: false,
        musicVolume: 0.5,
        muted: false,
        spotifyModeEnabled: true,
        volume: 0.5,
      }),
    );
    const screen = renderSoundProvider();

    await waitFor(() => expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(false));

    fireEvent.press(screen.getByLabelText("Finish intro"));

    expect(mockPlayers[3]).toMatchObject({
      loop: true,
      muted: true,
      volume: 0,
    });
    expect(mockPlayers[3].play).not.toHaveBeenCalled();
  });

  it("keeps music stopped after intro finishes when music is muted", async () => {
    await AsyncStorage.setItem(
      audioSettingsStorageKey,
      JSON.stringify({
        musicMuted: true,
        musicVolume: 0,
        muted: false,
        spotifyModeEnabled: false,
        volume: 1,
      }),
    );
    const screen = renderSoundProvider();

    await waitForHydratedAudio();

    fireEvent.press(screen.getByLabelText("Finish intro"));

    expect(mockPlayers[3]).toMatchObject({
      loop: true,
      muted: true,
      volume: 0,
    });
    expect(mockPlayers[3].play).not.toHaveBeenCalled();
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
          spotifyModeEnabled: false,
          volume: 0.5,
        }),
      ),
    );

    expect(mockPlayers.slice(0, 2).every((player) => !player.muted && player.volume === 0.5)).toBe(
      true,
    );
    expect(mockPlayers[3]).toMatchObject({
      loop: true,
      muted: true,
      volume: 0,
    });
    expect(mockPlayers[3].play).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Finish intro"));

    expect(mockPlayers[3]).toMatchObject({
      loop: true,
      muted: false,
      volume: 0.1,
    });
    expect(mockPlayers[3].play).toHaveBeenCalled();
    expect(mockPlayers[4]).toMatchObject({ muted: false, volume: 0.5 });
  });

  it("plays all game sounds when Spotify mode is off", async () => {
    const screen = renderSoundProvider();

    await waitForHydratedAudio();
    fireEvent.press(screen.getByLabelText("Play click"));
    fireEvent.press(screen.getByLabelText("Play game over"));
    fireEvent.press(screen.getByLabelText("Play victory"));

    await waitFor(() => {
      expect(mockPlayers[0].seekTo).toHaveBeenCalledTimes(1);
      expect(mockPlayers[1].seekTo).toHaveBeenCalledTimes(1);
      expect(mockPlayers[4].seekTo).toHaveBeenCalledTimes(1);
      expect(mockPlayers[0].play).toHaveBeenCalledTimes(1);
      expect(mockPlayers[1].play).toHaveBeenCalledTimes(1);
      expect(mockPlayers[4].play).toHaveBeenCalledTimes(1);
    });
  });

  it("plays intro sound even when Spotify mode is on", async () => {
    const screen = renderSoundProvider();

    await waitForHydratedAudio();
    fireEvent.press(screen.getByLabelText("Toggle Spotify mode"));

    await waitFor(() => expect(mockSetIsAudioActiveAsync).toHaveBeenLastCalledWith(false));
    fireEvent.press(screen.getByLabelText("Play intro"));

    await waitFor(() => {
      expect(mockSetIsAudioActiveAsync).toHaveBeenLastCalledWith(true);
      expect(mockPlayers[2]).toMatchObject({ muted: false, volume: 1 });
      expect(mockPlayers[2].seekTo).toHaveBeenCalledTimes(1);
      expect(mockPlayers[2].play).toHaveBeenCalledTimes(1);
    });
  });

  it("persists and applies selected game volume while Spotify mode is off", async () => {
    const screen = renderSoundProvider();

    await waitForHydratedAudio();
    fireEvent.press(screen.getByLabelText("Set low volume"));

    await waitFor(async () => {
      const storedSettings = await AsyncStorage.getItem(audioSettingsStorageKey);

      expect(JSON.parse(storedSettings ?? "{}")).toEqual({
        musicMuted: false,
        musicVolume: 0.1,
        muted: false,
        spotifyModeEnabled: false,
        volume: 0.1,
      });
    });

    expect(mockPlayers[0]).toMatchObject({ muted: false, volume: 0.1 });
    expect(mockPlayers[1]).toMatchObject({ muted: false, volume: 0.1 });
    expect(mockPlayers[3]).toMatchObject({ muted: true, volume: 0 });
    expect(mockPlayers[4]).toMatchObject({ muted: false, volume: 0.1 });

    fireEvent.press(screen.getByLabelText("Finish intro"));

    expect(mockPlayers[3]).toMatchObject({ muted: false, volume: 0.1 });
  });

  it("mutes and resumes looped music without changing sound volume while Spotify mode is off", async () => {
    const screen = renderSoundProvider();

    await waitForHydratedAudio();
    expect(mockPlayers[3].play).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Finish intro"));

    await waitFor(() => expect(mockPlayers[3].play).toHaveBeenCalled());

    fireEvent.press(screen.getByLabelText("Mute music"));

    await waitFor(() => {
      expect(mockPlayers[3]).toMatchObject({
        loop: true,
        muted: true,
        volume: 0,
      });
      expect(mockPlayers[3].pause).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByLabelText("Set music high"));

    await waitFor(async () => {
      const storedSettings = await AsyncStorage.getItem(audioSettingsStorageKey);

      expect(JSON.parse(storedSettings ?? "{}")).toEqual({
        musicMuted: false,
        musicVolume: 1,
        muted: false,
        spotifyModeEnabled: false,
        volume: 1,
      });
    });

    expect(mockPlayers[3]).toMatchObject({
      loop: true,
      muted: false,
      volume: 1,
    });
    expect(mockPlayers[0]).toMatchObject({ muted: false, volume: 1 });
  });
});
