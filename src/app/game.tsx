import { useEffect, useRef, useState } from "react";
import { router, Stack } from "expo-router";
import { Clock3, Home, RotateCcw } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NumberPad } from "@/components/NumberPad";
import { SudokuGrid } from "@/components/SudokuGrid";
import { useSound } from "@/audio/SoundProvider";
import { useGameStore } from "@/store/gameStore";
import { colors } from "@/theme/colors";
import { formatElapsedTime } from "@/utils/format";

function elapsedSeconds(
  startedAt: number | null,
  finishedAt: number | null,
  currentTime: number
): number {
  if (!startedAt) {
    return 0;
  }

  return Math.floor(((finishedAt ?? currentTime) - startedAt) / 1000);
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
  const finishedAt = useGameStore((state) => state.finishedAt);
  const restartGame = useGameStore((state) => state.restartGame);
  const { playGameOver, playUiClick } = useSound();
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const previousStatusRef = useRef(status);

  useEffect(() => {
    if (status !== "playing") {
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

  const elapsedTime = formatElapsedTime(elapsedSeconds(startedAt, finishedAt, currentTime));

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
        <SafeAreaView className="flex-1 justify-center gap-5 bg-canvas px-7">
          <Text className="text-3xl font-medium text-ink">Generation failed</Text>
          <Text className="text-base text-muted">{generationError}</Text>
          <Button label="Choose difficulty" onPress={() => router.replace("/difficulty")} />
        </SafeAreaView>
      </>
    );
  }

  if (!puzzle) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 justify-center gap-5 bg-canvas px-7">
          <Text className="text-3xl font-medium text-ink">No puzzle yet</Text>
          <Button label="Choose difficulty" onPress={() => router.replace("/difficulty")} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas px-4 pb-6 pt-3">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="relative h-11 justify-center">
        <View className="absolute left-0 right-0 items-center" pointerEvents="none">
          <Text className="text-sm font-medium uppercase tracking-wide text-muted">
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
          >
            <RotateCcw color={colors.muted} size={20} strokeWidth={1.8} absoluteStrokeWidth />
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
          >
            <Home color={colors.muted} size={20} strokeWidth={1.8} absoluteStrokeWidth />
          </Pressable>
        </View>
      </View>

      <View className="flex-1 justify-center">
        <View className="items-center" style={{ marginBottom: 30 }}>
          <Text className="text-xs font-medium uppercase tracking-wide text-muted">
            Errori {mistakeCount}/3
          </Text>
          <View className="mt-2 flex-row items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5">
            <Clock3 color={colors.muted} size={16} strokeWidth={1.8} absoluteStrokeWidth />
            <Text className="text-base font-medium tabular-nums text-ink">{elapsedTime}</Text>
          </View>
        </View>
        <SudokuGrid />
        <View style={{ marginTop: 56 }}>
          <NumberPad />
        </View>

        {status === "completed" ? (
          <View className="mt-5 gap-4 rounded-md border border-line bg-panel p-4">
            <Text className="text-center text-lg font-medium text-accent">Puzzle completed</Text>
            <Button label="New game" onPress={() => router.replace("/difficulty")} />
          </View>
        ) : null}

        {status === "lost" ? (
          <View className="mt-5 gap-4 rounded-md border border-line bg-panel p-4">
            <Text className="text-center text-lg font-medium text-danger">Game over</Text>
            <Button label="Back home" onPress={() => router.replace("/")} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
