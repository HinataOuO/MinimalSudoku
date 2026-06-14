import { router } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DIFFICULTIES } from "@/features/sudoku/types";
import { useGameStore } from "@/store/gameStore";

export default function DifficultyScreen() {
  const startNewGame = useGameStore((state) => state.startNewGame);

  return (
    <View className="flex-1 justify-center gap-6 px-6">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-ink">Difficulty</Text>
        <Text className="text-base text-muted">Choose how sparse grid should be.</Text>
      </View>

      <Card>
        <View className="gap-3">
          {DIFFICULTIES.map((difficulty) => (
            <Button
              key={difficulty}
              label={difficulty[0].toUpperCase() + difficulty.slice(1)}
              variant="secondary"
              onPress={() => {
                startNewGame(difficulty);
                router.replace("/game");
              }}
            />
          ))}
        </View>
      </Card>
    </View>
  );
}
