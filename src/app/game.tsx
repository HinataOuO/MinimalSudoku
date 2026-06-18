import { router, Stack } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { NumberPad } from "@/components/NumberPad";
import { SudokuGrid } from "@/components/SudokuGrid";
import { useGameStore } from "@/store/gameStore";

export default function GameScreen() {
  const hasHydrated = useGameStore((state) => state.hasHydrated);
  const difficulty = useGameStore((state) => state.difficulty);
  const status = useGameStore((state) => state.status);
  const puzzle = useGameStore((state) => state.puzzle);
  const restartGame = useGameStore((state) => state.restartGame);

  if (!hasHydrated) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 justify-center px-6">
          <Text className="text-center text-base font-semibold text-muted">Loading game...</Text>
        </SafeAreaView>
      </>
    );
  }

  if (!puzzle) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 justify-center gap-4 px-6">
          <Text className="text-2xl font-bold text-ink">No puzzle yet</Text>
          <Button label="Choose difficulty" onPress={() => router.replace("/difficulty")} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <SafeAreaView className="flex-1 justify-between px-2 pb-5 pt-2">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-1">
        <View>
          <Text className="text-xl font-bold text-ink">Sudoku</Text>
          <Text className="text-sm uppercase tracking-wide text-muted">{difficulty}</Text>
        </View>
        <Button label="Restart" variant="ghost" onPress={restartGame} className="px-3 py-2" />
      </View>

      <SudokuGrid />
      <NumberPad />

      {status === "completed" ? (
        <View className="gap-3 rounded-lg border border-line bg-panel p-3">
          <Text className="text-center text-lg font-bold text-accent">Puzzle complete</Text>
          <Button label="New game" onPress={() => router.replace("/difficulty")} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
