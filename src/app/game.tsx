import { router } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { NumberPad } from "@/components/NumberPad";
import { SudokuGrid } from "@/components/SudokuGrid";
import { useGameStore } from "@/store/gameStore";

export default function GameScreen() {
  const difficulty = useGameStore((state) => state.difficulty);
  const status = useGameStore((state) => state.status);
  const puzzle = useGameStore((state) => state.puzzle);
  const restartGame = useGameStore((state) => state.restartGame);

  if (!puzzle) {
    return (
      <View className="flex-1 justify-center gap-4 px-6">
        <Text className="text-2xl font-bold text-ink">No puzzle yet</Text>
        <Button label="Choose difficulty" onPress={() => router.replace("/difficulty")} />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center gap-5 px-4 py-6">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-ink">Sudoku</Text>
          <Text className="text-sm uppercase tracking-wide text-muted">{difficulty}</Text>
        </View>
        <Button label="Restart" variant="ghost" onPress={restartGame} />
      </View>

      <SudokuGrid />
      <NumberPad />

      {status === "completed" ? (
        <View className="gap-3 rounded-lg border border-line bg-panel p-4">
          <Text className="text-center text-lg font-bold text-accent">Puzzle complete</Text>
          <Button label="New game" onPress={() => router.replace("/difficulty")} />
        </View>
      ) : null}
    </View>
  );
}
