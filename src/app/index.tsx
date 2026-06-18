import { Link } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useGameStore } from "@/store/gameStore";

export default function HomeScreen() {
  const hasHydrated = useGameStore((state) => state.hasHydrated);
  const hasGame = useGameStore((state) => state.puzzle !== null);

  if (!hasHydrated) {
    return (
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-base font-semibold text-muted">Loading game...</Text>
      </View>
    );
  }

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
          <Link href="/difficulty" asChild>
            <Button label="Play" />
          </Link>
          {hasGame ? (
            <Link href="/game" asChild>
              <Button label="Resume" variant="secondary" />
            </Link>
          ) : null}
        </View>
      </Card>
    </View>
  );
}
