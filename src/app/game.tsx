import { useCallback, useEffect, useRef, useState } from "react";
import { router, Stack, useFocusEffect } from "expo-router";
import { Clock3, Home, RotateCcw } from "lucide-react-native";
import { AppState, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NumberPad } from "@/components/NumberPad";
import { SudokuGrid } from "@/components/SudokuGrid";
import { useSound } from "@/audio/SoundProvider";
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
  const { playGameOver, playUiClick } = useSound();
  const theme = useThemeColors();
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const previousStatusRef = useRef(status);

  useFocusEffect(
    useCallback(() => {
      if (hasHydrated) {
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
      resumeTimer();
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
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

    previousStatusRef.current = status;
  }, [hasHydrated, playGameOver, status]);

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

        {status === "completed" ? (
          <View
            className="mt-5 gap-4 rounded-md border border-line bg-panel p-4"
            style={{ backgroundColor: theme.panel, borderColor: theme.line }}
          >
            <Text
              className="text-center text-lg font-medium text-accent"
              style={{ color: theme.accent }}
            >
              Puzzle completed
            </Text>
            <Button label="New game" onPress={() => router.replace("/difficulty")} />
          </View>
        ) : null}

        {status === "lost" ? (
          <View
            className="mt-5 gap-4 rounded-md border border-line bg-panel p-4"
            style={{ backgroundColor: theme.panel, borderColor: theme.line }}
          >
            <Text
              className="text-center text-lg font-medium text-danger"
              style={{ color: theme.danger }}
            >
              Game over
            </Text>
            <Button label="Back home" onPress={() => router.replace("/")} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
