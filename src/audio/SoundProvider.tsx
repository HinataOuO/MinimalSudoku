import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { Platform } from "react-native";
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer, type AudioSource } from "expo-audio";

type SoundControls = {
  musicMuted: boolean;
  musicVolume: number;
  muted: boolean;
  playGameOver: () => void;
  playUiClick: () => void;
  playVictory: () => void;
  setMusicVolume: (volume: number) => void;
  setVolume: (volume: number) => void;
  toggleMuted: () => void;
  volume: number;
};

type AudioSettingsState = {
  musicMuted: boolean;
  musicVolume: number;
  muted: boolean;
  volume: number;
};

const defaultAudioSettings: AudioSettingsState = {
  musicMuted: false,
  musicVolume: 0.1,
  muted: false,
  volume: 1
};

const audioPresetVolumes = [0, 0.1, 0.5, 1] as const;

const SoundContext = createContext<SoundControls>({
  musicMuted: defaultAudioSettings.musicMuted,
  musicVolume: defaultAudioSettings.musicVolume,
  muted: defaultAudioSettings.muted,
  playGameOver: () => undefined,
  playUiClick: () => undefined,
  playVictory: () => undefined,
  setMusicVolume: () => undefined,
  setVolume: () => undefined,
  toggleMuted: () => undefined,
  volume: defaultAudioSettings.volume
});

const audioSettingsStorageKey = "minimal-sudoku-audio-settings";

function clampVolume(volume: number) {
  return Math.min(1, Math.max(0, volume));
}

function isPresetVolume(volume: number) {
  return audioPresetVolumes.some((presetVolume) => Math.abs(volume - presetVolume) < 0.01);
}

function normalizeVolumeSettings(
  volume: unknown,
  muted: unknown,
  defaultVolume: number
) {
  if (typeof volume !== "number") {
    return {
      muted: false,
      volume: defaultVolume
    };
  }

  const normalizedVolume = clampVolume(volume);

  if (!isPresetVolume(normalizedVolume)) {
    return {
      muted: false,
      volume: defaultVolume
    };
  }

  return {
    muted: normalizedVolume === 0 || muted === true,
    volume: normalizedVolume
  };
}

function normalizeAudioSettings(settings: Partial<AudioSettingsState>) {
  const sounds = normalizeVolumeSettings(
    settings.volume,
    settings.muted,
    defaultAudioSettings.volume
  );
  const music = normalizeVolumeSettings(
    settings.musicVolume,
    settings.musicMuted,
    defaultAudioSettings.musicVolume
  );

  return {
    musicMuted: music.muted,
    musicVolume: music.volume,
    muted: sounds.muted,
    volume: sounds.volume
  };
}

function applyAudioSettingsToPlayer(player: AudioPlayer, settings: AudioSettingsState) {
  if (settings.muted || settings.volume === 0) {
    player.muted = true;
    player.volume = 0;
    return;
  }

  player.muted = false;
  player.volume = settings.volume;
}

function applyMusicSettingsToPlayer(player: AudioPlayer, settings: AudioSettingsState) {
  player.loop = true;

  if (settings.musicMuted || settings.musicVolume === 0) {
    player.muted = true;
    player.volume = 0;
    player.pause();
    return;
  }

  player.muted = false;
  player.volume = settings.musicVolume;
  player.play();
}

function playFromStart(player: AudioPlayer) {
  void player
    .seekTo(0)
    .then(() => {
      player.play();
    })
    .catch(() => undefined);
}

const clickSound = require("../../assets/audio/click.mp3") as AudioSource;
const gameOverSound = require("../../assets/audio/lose.mp3") as AudioSource;
const musicSound = require("../../assets/audio/loop.mp3") as AudioSource;
const victorySound = require("../../assets/audio/win.mp3") as AudioSource;

export function SoundProvider({ children }: { children: ReactNode }) {
  const clickPlayer = useAudioPlayer(clickSound);
  const gameOverPlayer = useAudioPlayer(gameOverSound);
  const musicPlayer = useAudioPlayer(musicSound);
  const victoryPlayer = useAudioPlayer(victorySound);
  const [musicVolume, setMusicVolumeState] = useState(defaultAudioSettings.musicVolume);
  const [musicMuted, setMusicMuted] = useState(defaultAudioSettings.musicMuted);
  const [volume, setVolumeState] = useState(defaultAudioSettings.volume);
  const [muted, setMuted] = useState(defaultAudioSettings.muted);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const settingsRef = useRef<AudioSettingsState>(defaultAudioSettings);
  const settingsChangedDuringHydrationRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      return;
    }

    void setAudioModeAsync({
      allowsRecording: false,
      interruptionMode: "mixWithOthers",
      interruptionModeAndroid: "doNotMix",
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false
    }).catch((error) => {
      if (__DEV__) {
        console.warn("Unable to configure audio mode", error);
      }
    });
  }, []);
  const isPersistingSettingsRef = useRef(false);
  const pendingSettingsRef = useRef<AudioSettingsState | null>(null);

  const applyAudioSettings = useCallback(
    (nextSettings: AudioSettingsState) => {
      applyAudioSettingsToPlayer(clickPlayer, nextSettings);
      applyAudioSettingsToPlayer(gameOverPlayer, nextSettings);
      applyAudioSettingsToPlayer(victoryPlayer, nextSettings);
    },
    [clickPlayer, gameOverPlayer, victoryPlayer]
  );

  const applyMusicSettings = useCallback(
    (nextSettings: AudioSettingsState) => {
      applyMusicSettingsToPlayer(musicPlayer, nextSettings);
    },
    [musicPlayer]
  );

  const persistQueuedAudioSettings = useCallback((nextSettings: AudioSettingsState) => {
    void AsyncStorage.setItem(audioSettingsStorageKey, JSON.stringify(nextSettings))
      .catch(() => undefined)
      .finally(() => {
        const pendingSettings = pendingSettingsRef.current;
        pendingSettingsRef.current = null;

        if (pendingSettings) {
          persistQueuedAudioSettings(pendingSettings);
          return;
        }

        isPersistingSettingsRef.current = false;
      });
  }, []);

  const queuePersistAudioSettings = useCallback(
    (nextSettings: AudioSettingsState) => {
      if (isPersistingSettingsRef.current) {
        pendingSettingsRef.current = nextSettings;
        return;
      }

      isPersistingSettingsRef.current = true;
      persistQueuedAudioSettings(nextSettings);
    },
    [persistQueuedAudioSettings]
  );

  useEffect(() => {
    let isMounted = true;

    void AsyncStorage.getItem(audioSettingsStorageKey)
      .then((storedSettings) => {
        if (!isMounted) {
          return;
        }

        if (settingsChangedDuringHydrationRef.current) {
          return;
        }

        const loadedSettings = storedSettings
          ? normalizeAudioSettings(JSON.parse(storedSettings) as Partial<AudioSettingsState>)
          : defaultAudioSettings;

        settingsRef.current = loadedSettings;
        setMusicVolumeState(loadedSettings.musicVolume);
        setMusicMuted(loadedSettings.musicMuted);
        setVolumeState(loadedSettings.volume);
        setMuted(loadedSettings.muted);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) {
          setSettingsHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!settingsHydrated) {
      return;
    }

    applyAudioSettings(settingsRef.current);
    applyMusicSettings(settingsRef.current);
  }, [
    applyAudioSettings,
    applyMusicSettings,
    musicMuted,
    musicVolume,
    muted,
    settingsHydrated,
    volume
  ]);

  const playUiClick = useCallback(() => {
    playFromStart(clickPlayer);
  }, [clickPlayer]);

  const playGameOver = useCallback(() => {
    playFromStart(gameOverPlayer);
  }, [gameOverPlayer]);

  const playVictory = useCallback(() => {
    playFromStart(victoryPlayer);
  }, [victoryPlayer]);

  const setVolume = useCallback((nextVolume: number) => {
    settingsChangedDuringHydrationRef.current = true;
    const clampedVolume = clampVolume(nextVolume);
    const normalizedSounds = normalizeVolumeSettings(
      clampedVolume,
      clampedVolume === 0,
      defaultAudioSettings.volume
    );
    const nextSettings = {
      ...settingsRef.current,
      muted: normalizedSounds.muted,
      volume: normalizedSounds.volume
    };

    settingsRef.current = nextSettings;
    applyAudioSettings(nextSettings);
    setVolumeState(nextSettings.volume);
    setMuted(nextSettings.muted);
    queuePersistAudioSettings(nextSettings);
  }, [applyAudioSettings, queuePersistAudioSettings]);

  const setMusicVolume = useCallback((nextVolume: number) => {
    settingsChangedDuringHydrationRef.current = true;
    const clampedVolume = clampVolume(nextVolume);
    const normalizedMusic = normalizeVolumeSettings(
      clampedVolume,
      clampedVolume === 0,
      defaultAudioSettings.musicVolume
    );
    const nextSettings = {
      ...settingsRef.current,
      musicMuted: normalizedMusic.muted,
      musicVolume: normalizedMusic.volume
    };

    settingsRef.current = nextSettings;
    applyMusicSettings(nextSettings);
    setMusicVolumeState(nextSettings.musicVolume);
    setMusicMuted(nextSettings.musicMuted);
    queuePersistAudioSettings(nextSettings);
  }, [applyMusicSettings, queuePersistAudioSettings]);

  const toggleMuted = useCallback(() => {
    settingsChangedDuringHydrationRef.current = true;
    const nextMuted = !settingsRef.current.muted;
    const normalizedSounds = normalizeVolumeSettings(
      !nextMuted && settingsRef.current.volume === 0
        ? defaultAudioSettings.volume
        : settingsRef.current.volume,
      nextMuted,
      defaultAudioSettings.volume
    );
    const nextSettings = {
      ...settingsRef.current,
      muted: normalizedSounds.muted,
      volume: normalizedSounds.volume
    };

    settingsRef.current = nextSettings;
    applyAudioSettings(nextSettings);
    setMuted(nextSettings.muted);
    queuePersistAudioSettings(nextSettings);
  }, [applyAudioSettings, queuePersistAudioSettings]);

  return (
    <SoundContext.Provider
      value={{
        musicMuted,
        musicVolume,
        muted,
        playGameOver,
        playUiClick,
        playVictory,
        setMusicVolume,
        setVolume,
        toggleMuted,
        volume
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
