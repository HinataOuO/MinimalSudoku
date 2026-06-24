import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router, Stack, useFocusEffect } from "expo-router";
import { Clock3, Home, RotateCcw, Share2, X } from "lucide-react-native";
import { AppState, Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSound } from "@/audio/SoundProvider";
import { Button } from "@/components/Button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NumberPad } from "@/components/NumberPad";
import { SudokuGrid } from "@/components/SudokuGrid";
import {
  buildSharedGameUrl,
  createSharedGamePayload
} from "@/features/sharing/sharedGame";
import { useGameStore } from "@/store/gameStore";
import { useThemeColors } from "@/theme/colors";
import { formatElapsedTime } from "@/utils/format";

function elapsedSeconds(
  elapsedMs: number,
  startedAt: number | null,
  currentTime: number
): number {
  const activeElapsedMs = startedAt === null ? 0 : Math.max(0, currentTime - startedAt);

  return Math.floor((elapsedMs + activeElapsedMs) / 1000);
}

type GameResultScreenProps = {
  elapsedTime: string;
  result: "completed" | "lost";
};

function GameResultScreen({ elapsedTime, result }: GameResultScreenProps) {
  const { playUiClick } = useSound();
  const theme = useThemeColors();
  const completed = result === "completed";

  return (
    <SafeAreaView
      className="flex-1 bg-canvas px-7 py-8"
      style={{ backgroundColor: theme.canvas }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1">
        <View className="flex-[3] items-center justify-end gap-4">
          <Text
            adjustsFontSizeToFit
            accessibilityLabel={`Final time ${elapsedTime}`}
            className="w-full text-center font-normal tabular-nums text-ink"
            minimumFontScale={0.55}
            numberOfLines={1}
            style={{ color: theme.muted, fontSize: 96, lineHeight: 108 }}
          >
            {elapsedTime}
          </Text>
          <Text
            accessibilityRole="header"
            className="text-center text-7xl font-medium uppercase tracking-widest"
            style={{ color: completed ? theme.success : theme.danger }}
          >
            {completed ? "DONE" : "LOSE"}
          </Text>
        </View>

        <View className="flex-[2] items-center justify-center">
          <Pressable
            accessibilityLabel="Back to main menu"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              playUiClick();
              router.replace("/");
            }}
            className="w-24 items-center justify-center gap-1 rounded-md border border-line bg-panel px-2 py-2 active:bg-accentSoft"
            style={{ backgroundColor: theme.panel, borderColor: theme.line }}
          >
            <Home color={theme.muted} size={24} strokeWidth={1.8} absoluteStrokeWidth />
            <Text
              className="text-xs font-medium uppercase tracking-wide text-muted"
              style={{ color: theme.muted }}
            >
              Home
            </Text>
          </Pressable>
        </View>
        <View className="flex-[2]" />
      </View>
    </SafeAreaView>
  );
}

export default function GameScreen() {
  const hasHydrated = useGameStore((state) => state.hasHydrated);
  const difficulty = useGameStore((state) => state.difficulty);
  const status = useGameStore((state) => state.status);
  const mistakeCount = useGameStore((state) => state.mistakeCount);
  const puzzle = useGameStore((state) => state.puzzle);
  const isGenerating = useGameStore((state) => state.isGenerating);
  const generationError = useGameStore((state) => state.generationError);
  const startedAt = useGameStore((state) => state.startedAt);
  const elapsedMs = useGameStore((state) => state.elapsedMs);
  const restartGame = useGameStore((state) => state.restartGame);
  const pauseTimer = useGameStore((state) => state.pauseTimer);
  const resumeTimer = useGameStore((state) => state.resumeTimer);
  const arcadeModeEnabled = useGameStore((state) => state.arcadeModeEnabled);
  const { playGameOver, playUiClick, playVictory } = useSound();
  const theme = useThemeColors();
  const { width } = useWindowDimensions();
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [shareVisible, setShareVisible] = useState(false);
  const shareVisibleRef = useRef(false);
  const previousStatusRef = useRef(status);

  const sharedGameUrl = useMemo(() => {
    if (!puzzle) {
      return null;
    }

    return buildSharedGameUrl(
      createSharedGamePayload(difficulty, arcadeModeEnabled, puzzle.givens)
    );
  }, [arcadeModeEnabled, difficulty, puzzle]);

  const openShare = useCallback(() => {
    shareVisibleRef.current = true;
    pauseTimer();
    setShareVisible(true);
  }, [pauseTimer]);

  const closeShare = useCallback(() => {
    shareVisibleRef.current = false;
    setShareVisible(false);
    resumeTimer();
  }, [resumeTimer]);

  useFocusEffect(
    useCallback(() => {
      if (hasHydrated && !shareVisibleRef.current) {
        resumeTimer();
      }

      return () => {
        pauseTimer();
      };
    }, [hasHydrated, pauseTimer, resumeTimer])
  );

  useEffect(() => {
    if (!hasHydrated) {
      return undefined;
    }

    if (AppState.currentState === "active") {
      if (!shareVisibleRef.current) {
        resumeTimer();
      }
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && !shareVisibleRef.current) {
        resumeTimer();
      } else {
        pauseTimer();
      }
    });

    return () => subscription.remove();
  }, [hasHydrated, pauseTimer, resumeTimer]);

  useEffect(() => {
    if (status !== "playing" || startedAt === null) {
      return undefined;
    }

    setCurrentTime(Date.now());

    const timerId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timerId);
  }, [status, startedAt]);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;

    if (hasHydrated && previousStatus === "playing" && status === "lost") {
      playGameOver();
    }

    if (hasHydrated && previousStatus === "playing" && status === "completed") {
      playVictory();
    }

    previousStatusRef.current = status;
  }, [hasHydrated, playGameOver, playVictory, status]);

  const elapsedTime = formatElapsedTime(elapsedSeconds(elapsedMs, startedAt, currentTime));

  if (!hasHydrated || isGenerating) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen safeArea />
      </>
    );
  }

  if (generationError) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView
          className="flex-1 justify-center gap-5 bg-canvas px-7"
          style={{ backgroundColor: theme.canvas }}
        >
          <Text className="text-3xl font-medium text-ink" style={{ color: theme.ink }}>
            Generation failed
          </Text>
          <Text className="text-base text-muted" style={{ color: theme.muted }}>
            {generationError}
          </Text>
          <Button label="Choose difficulty" onPress={() => router.replace("/difficulty")} />
        </SafeAreaView>
      </>
    );
  }

  if (!puzzle) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView
          className="flex-1 justify-center gap-5 bg-canvas px-7"
          style={{ backgroundColor: theme.canvas }}
        >
          <Text className="text-3xl font-medium text-ink" style={{ color: theme.ink }}>
            No puzzle yet
          </Text>
          <Button label="Choose difficulty" onPress={() => router.replace("/difficulty")} />
        </SafeAreaView>
      </>
    );
  }

  if (status === "completed" || status === "lost") {
    return <GameResultScreen elapsedTime={elapsedTime} result={status} />;
  }

  return (
    <SafeAreaView
      className="flex-1 bg-canvas px-4 pb-6 pt-3"
      style={{ backgroundColor: theme.canvas }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View className="relative h-11 justify-center">
        <View className="absolute left-0 right-0 items-center" pointerEvents="none">
          <Text
            className="text-sm font-medium uppercase tracking-wide text-muted"
            style={{ color: theme.muted }}
          >
            {difficulty}
          </Text>
        </View>
        <View className="ml-auto flex-row items-center gap-2">
          <Pressable
            accessibilityLabel="Condividi partita"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              playUiClick();
              openShare();
            }}
            className="h-10 w-10 items-center justify-center rounded-md border border-line bg-transparent active:opacity-75"
            style={{ borderColor: theme.line }}
          >
            <Share2 color={theme.muted} size={20} strokeWidth={1.8} absoluteStrokeWidth />
          </Pressable>
          <Pressable
            accessibilityLabel="Restart game"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              playUiClick();
              restartGame();
            }}
            className="h-10 w-10 items-center justify-center rounded-md border border-line bg-transparent active:opacity-75"
            style={{ borderColor: theme.line }}
          >
            <RotateCcw color={theme.muted} size={20} strokeWidth={1.8} absoluteStrokeWidth />
          </Pressable>
          <Pressable
            accessibilityLabel="Back to main menu"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              playUiClick();
              router.replace("/");
            }}
            className="h-10 w-10 items-center justify-center rounded-md border border-line bg-transparent active:opacity-75"
            style={{ borderColor: theme.line }}
          >
            <Home color={theme.muted} size={20} strokeWidth={1.8} absoluteStrokeWidth />
          </Pressable>
        </View>
      </View>

      <View className="flex-1 justify-center">
        <View className="items-center" style={{ marginBottom: 30 }}>
          <Text
            className="text-xs font-medium uppercase tracking-wide text-muted"
            style={{ color: theme.muted }}
          >
            Errori {mistakeCount}/3
          </Text>
          <View
            className="mt-2 flex-row items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5"
            style={{ backgroundColor: theme.panel, borderColor: theme.line }}
          >
            <Clock3 color={theme.muted} size={16} strokeWidth={1.8} absoluteStrokeWidth />
            <Text
              className="text-base font-medium tabular-nums text-ink"
              style={{ color: theme.ink }}
            >
              {elapsedTime}
            </Text>
          </View>
        </View>
        <SudokuGrid />
        <View style={{ marginTop: 56 }}>
          <NumberPad />
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={closeShare}
        statusBarTranslucent
        visible={shareVisible}
      >
        <SafeAreaView
          className="flex-1 bg-canvas px-7 py-6"
          style={{ backgroundColor: theme.canvas }}
        >
          <View className="flex-row items-center justify-between">
            <Text
              accessibilityRole="header"
              className="text-2xl font-medium text-ink"
              style={{ color: theme.ink }}
            >
              Condividi partita
            </Text>
            <Pressable
              accessibilityLabel="Chiudi condivisione"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                playUiClick();
                closeShare();
              }}
              className="h-10 w-10 items-center justify-center rounded-md border border-line active:opacity-75"
              style={{ borderColor: theme.line }}
            >
              <X color={theme.muted} size={22} strokeWidth={1.8} absoluteStrokeWidth />
            </Pressable>
          </View>

          <View className="flex-1 items-center justify-center gap-6">
            <View
              className="items-center justify-center rounded-xl bg-white p-5"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              {sharedGameUrl ? (
                <QRCode
                  backgroundColor="#FFFFFF"
                  color="#111111"
                  size={Math.min(width - 96, 320)}
                  value={sharedGameUrl}
                />
              ) : null}
            </View>
            <View className="max-w-sm gap-2">
              <Text
                className="text-center text-lg font-medium text-ink"
                style={{ color: theme.ink }}
              >
                Scansiona con la fotocamera
              </Text>
              <Text
                className="text-center text-sm leading-5 text-muted"
                style={{ color: theme.muted }}
              >
                Il link apre una nuova partita con stessa griglia, difficoltà e modalità Arcade.
              </Text>
            </View>
          </View>

          <Button label="Chiudi" onPress={closeShare} variant="secondary" />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
