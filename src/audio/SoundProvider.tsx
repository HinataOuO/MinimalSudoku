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
import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer,
  type AudioMode,
  type AudioPlayer,
  type AudioSource
} from "expo-audio";

type SoundControls = {
  musicMuted: boolean;
  musicVolume: number;
  muted: boolean;
  playGameOver: () => void;
  playIntro: () => void;
  playUiClick: () => void;
  playVictory: () => void;
  setIntroFinished: () => void;
  setMusicVolume: (volume: number) => void;
  setVolume: (volume: number) => void;
  spotifyModeEnabled: boolean;
  toggleMuted: () => void;
  toggleSpotifyMode: () => void;
  volume: number;
};

type AudioSettingsState = {
  musicMuted: boolean;
  musicVolume: number;
  muted: boolean;
  spotifyModeEnabled: boolean;
  volume: number;
};

const defaultAudioSettings: AudioSettingsState = {
  musicMuted: false,
  musicVolume: 0.1,
  muted: false,
  spotifyModeEnabled: false,
  volume: 1
};

const audioPresetVolumes = [0, 0.1, 0.5, 1] as const;

const SoundContext = createContext<SoundControls>({
  musicMuted: defaultAudioSettings.musicMuted,
  musicVolume: defaultAudioSettings.musicVolume,
  muted: defaultAudioSettings.muted,
  playGameOver: () => undefined,
  playIntro: () => undefined,
  playUiClick: () => undefined,
  playVictory: () => undefined,
  setIntroFinished: () => undefined,
  setMusicVolume: () => undefined,
  setVolume: () => undefined,
  spotifyModeEnabled: defaultAudioSettings.spotifyModeEnabled,
  toggleMuted: () => undefined,
  toggleSpotifyMode: () => undefined,
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
    spotifyModeEnabled: settings.spotifyModeEnabled === true,
    volume: sounds.volume
  };
}

function applyAudioSettingsToPlayer(player: AudioPlayer, settings: AudioSettingsState) {
  if (settings.spotifyModeEnabled || settings.muted || settings.volume === 0) {
    player.muted = true;
    player.volume = 0;
    return;
  }

  player.muted = false;
  player.volume = settings.volume;
}

function applyMusicSettingsToPlayer(
  player: AudioPlayer,
  settings: AudioSettingsState,
  introFinished: boolean
) {
  player.loop = true;

  if (
    !introFinished ||
    settings.spotifyModeEnabled ||
    settings.musicMuted ||
    settings.musicVolume === 0
  ) {
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

function getPlaybackAudioMode(): Partial<AudioMode> {
  return {
    allowsRecording: false,
    interruptionMode: "mixWithOthers",
    interruptionModeAndroid: "doNotMix",
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false
  };
}

const clickSound = require("../../assets/audio/click.mp3") as AudioSource;
const gameOverSound = require("../../assets/audio/lose.mp3") as AudioSource;
const introSound = require("../../assets/audio/intro.wav") as AudioSource;
const musicSound = require("../../assets/audio/loop.mp3") as AudioSource;
const victorySound = require("../../assets/audio/win.mp3") as AudioSource;
const introAudioRestoreDelayMs = 1300;

export function SoundProvider({ children }: { children: ReactNode }) {
  const clickPlayer = useAudioPlayer(clickSound);
  const gameOverPlayer = useAudioPlayer(gameOverSound);
  const introPlayer = useAudioPlayer(introSound);
  const musicPlayer = useAudioPlayer(musicSound);
  const victoryPlayer = useAudioPlayer(victorySound);
  const [audioModeConfigured, setAudioModeConfigured] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(defaultAudioSettings.musicVolume);
  const [musicMuted, setMusicMuted] = useState(defaultAudioSettings.musicMuted);
  const [volume, setVolumeState] = useState(defaultAudioSettings.volume);
  const [muted, setMuted] = useState(defaultAudioSettings.muted);
  const [spotifyModeEnabled, setSpotifyModeEnabled] = useState(
    defaultAudioSettings.spotifyModeEnabled
  );
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const settingsRef = useRef<AudioSettingsState>(defaultAudioSettings);
  const introFinishedRef = useRef(false);
  const settingsChangedDuringHydrationRef = useRef(false);
  const isPersistingSettingsRef = useRef(false);
  const introAudioRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSettingsRef = useRef<AudioSettingsState | null>(null);

  useEffect(() => {
    let isMounted = true;

    void setAudioModeAsync(getPlaybackAudioMode())
      .catch((error) => {
        if (__DEV__) {
          console.warn("Unable to configure audio mode", error);
        }
      })
      .finally(() => {
        if (isMounted) {
          setAudioModeConfigured(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (introAudioRestoreTimerRef.current) {
        clearTimeout(introAudioRestoreTimerRef.current);
      }
    };
  }, []);

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
      applyMusicSettingsToPlayer(musicPlayer, nextSettings, introFinishedRef.current);
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

  const applyAudioActiveState = useCallback((nextSettings: AudioSettingsState) => {
    void setIsAudioActiveAsync(!nextSettings.spotifyModeEnabled).catch((error) => {
      if (__DEV__) {
        console.warn("Unable to update audio active state", error);
      }
    });
  }, []);

  const applySettings = useCallback(
    (nextSettings: AudioSettingsState) => {
      applyAudioActiveState(nextSettings);
      applyAudioSettings(nextSettings);
      applyMusicSettings(nextSettings);
    },
    [applyAudioActiveState, applyAudioSettings, applyMusicSettings]
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
        setSpotifyModeEnabled(loadedSettings.spotifyModeEnabled);
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
    if (!settingsHydrated || !audioModeConfigured) {
      return;
    }

    applySettings(settingsRef.current);
  }, [
    applySettings,
    audioModeConfigured,
    musicMuted,
    musicVolume,
    muted,
    settingsHydrated,
    spotifyModeEnabled,
    volume
  ]);

  const playUiClick = useCallback(() => {
    if (settingsRef.current.spotifyModeEnabled) {
      return;
    }

    playFromStart(clickPlayer);
  }, [clickPlayer]);

  const playGameOver = useCallback(() => {
    if (settingsRef.current.spotifyModeEnabled) {
      return;
    }

    playFromStart(gameOverPlayer);
  }, [gameOverPlayer]);

  const playIntro = useCallback(() => {
    const shouldRestoreSpotifyMode = settingsRef.current.spotifyModeEnabled;

    if (introAudioRestoreTimerRef.current) {
      clearTimeout(introAudioRestoreTimerRef.current);
      introAudioRestoreTimerRef.current = null;
    }

    introPlayer.muted = false;
    introPlayer.volume = 1;

    void setIsAudioActiveAsync(true)
      .catch((error) => {
        if (__DEV__) {
          console.warn("Unable to activate intro audio", error);
        }
      })
      .finally(() => {
        playFromStart(introPlayer);

        if (shouldRestoreSpotifyMode) {
          introAudioRestoreTimerRef.current = setTimeout(() => {
            introAudioRestoreTimerRef.current = null;
            void setIsAudioActiveAsync(false).catch((error) => {
              if (__DEV__) {
                console.warn("Unable to restore Spotify audio mode", error);
              }
            });
          }, introAudioRestoreDelayMs);
        }
      });
  }, [introPlayer]);

  const playVictory = useCallback(() => {
    if (settingsRef.current.spotifyModeEnabled) {
      return;
    }

    playFromStart(victoryPlayer);
  }, [victoryPlayer]);

  const setIntroFinished = useCallback(() => {
    if (introFinishedRef.current) {
      return;
    }

    introFinishedRef.current = true;
    if (settingsHydrated && audioModeConfigured) {
      applySettings(settingsRef.current);
    }
  }, [applySettings, audioModeConfigured, settingsHydrated]);

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

  const toggleSpotifyMode = useCallback(() => {
    settingsChangedDuringHydrationRef.current = true;
    const nextSettings = {
      ...settingsRef.current,
      spotifyModeEnabled: !settingsRef.current.spotifyModeEnabled
    };

    settingsRef.current = nextSettings;
    applySettings(nextSettings);
    setSpotifyModeEnabled(nextSettings.spotifyModeEnabled);
    queuePersistAudioSettings(nextSettings);
  }, [applySettings, queuePersistAudioSettings]);

  return (
    <SoundContext.Provider
      value={{
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
        toggleMuted,
        toggleSpotifyMode,
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
