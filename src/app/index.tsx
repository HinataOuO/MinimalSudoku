import { router } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useGameStore } from "@/store/gameStore";

export default function HomeScreen() {
  const hasGame = useGameStore((state) => state.puzzle !== null);

  return (
    <View className="flex-1 justify-center gap-6 px-6">
      <View className="gap-2">
        <Text className="text-4xl font-bold text-ink">Minimal Sudoku</Text>
        <Text className="text-base leading-6 text-muted">
          Clean offline Sudoku. Pick difficulty, solve grid, resume anytime.
        </Text>
      </View>

      <Card>
        <View className="gap-3">
          <Button label="Play" onPress={() => router.push("/difficulty")} />
          {hasGame ? (
            <Button
              label="Resume"
              variant="secondary"
              onPress={() => router.push("/game")}
            />
          ) : null}
        </View>
      </Card>
    </View>
  );
}
