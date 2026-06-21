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
import { useAudioPlayer, type AudioPlayer, type AudioSource } from "expo-audio";

type SoundControls = {
  muted: boolean;
  playGameOver: () => void;
  playUiClick: () => void;
  setVolume: (volume: number) => void;
  toggleMuted: () => void;
  volume: number;
};

type AudioSettingsState = {
  muted: boolean;
  volume: number;
};

const defaultAudioSettings: AudioSettingsState = {
  muted: false,
  volume: 1
};

const audioPresetVolumes = [0, 0.1, 0.5, 1] as const;

const SoundContext = createContext<SoundControls>({
  muted: defaultAudioSettings.muted,
  playGameOver: () => undefined,
  playUiClick: () => undefined,
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

function normalizeAudioSettings(settings: Partial<AudioSettingsState>) {
  if (typeof settings.volume !== "number") {
    return defaultAudioSettings;
  }

  const volume = clampVolume(settings.volume);

  if (!isPresetVolume(volume)) {
    return defaultAudioSettings;
  }

  return {
    muted: volume === 0 || settings.muted === true,
    volume
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

function playFromStart(player: AudioPlayer) {
  void player
    .seekTo(0)
    .then(() => {
      player.play();
    })
    .catch(() => undefined);
}

const clickSound = require("../../assets/audio/click.mp3") as AudioSource;
const gameOverSound = require("../../assets/audio/gameOver.mp3") as AudioSource;

export function SoundProvider({ children }: { children: ReactNode }) {
  const clickPlayer = useAudioPlayer(clickSound);
  const gameOverPlayer = useAudioPlayer(gameOverSound);
  const [volume, setVolumeState] = useState(defaultAudioSettings.volume);
  const [muted, setMuted] = useState(defaultAudioSettings.muted);
  const settingsRef = useRef<AudioSettingsState>(defaultAudioSettings);
  const isPersistingSettingsRef = useRef(false);
  const pendingSettingsRef = useRef<AudioSettingsState | null>(null);

  const applyAudioSettings = useCallback(
    (nextSettings: AudioSettingsState) => {
      applyAudioSettingsToPlayer(clickPlayer, nextSettings);
      applyAudioSettingsToPlayer(gameOverPlayer, nextSettings);
    },
    [clickPlayer, gameOverPlayer]
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
        if (!storedSettings || !isMounted) {
          return;
        }

        const parsedSettings = JSON.parse(storedSettings) as Partial<{
          muted: boolean;
          volume: number;
        }>;

        const loadedSettings = normalizeAudioSettings(parsedSettings);

        settingsRef.current = loadedSettings;
        setVolumeState(loadedSettings.volume);
        setMuted(loadedSettings.muted);
      })
      .catch(() => undefined)
      .finally(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    applyAudioSettings(settingsRef.current);
  }, [applyAudioSettings, muted, volume]);

  const playUiClick = useCallback(() => {
    playFromStart(clickPlayer);
  }, [clickPlayer]);

  const playGameOver = useCallback(() => {
    playFromStart(gameOverPlayer);
  }, [gameOverPlayer]);

  const setVolume = useCallback((nextVolume: number) => {
    const clampedVolume = clampVolume(nextVolume);
    const nextSettings = normalizeAudioSettings({
      muted: clampedVolume === 0,
      volume: clampedVolume
    });

    settingsRef.current = nextSettings;
    applyAudioSettings(nextSettings);
    setVolumeState(nextSettings.volume);
    setMuted(nextSettings.muted);
    queuePersistAudioSettings(nextSettings);
  }, [applyAudioSettings, queuePersistAudioSettings]);

  const toggleMuted = useCallback(() => {
    const nextMuted = !settingsRef.current.muted;
    const nextSettings = normalizeAudioSettings({
      muted: nextMuted,
      volume:
        !nextMuted && settingsRef.current.volume === 0
          ? defaultAudioSettings.volume
          : settingsRef.current.volume
    });

    settingsRef.current = nextSettings;
    applyAudioSettings(nextSettings);
    setMuted(nextSettings.muted);
    queuePersistAudioSettings(nextSettings);
  }, [applyAudioSettings, queuePersistAudioSettings]);

  return (
    <SoundContext.Provider
      value={{ muted, playGameOver, playUiClick, setVolume, toggleMuted, volume }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
