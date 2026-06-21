import { router, Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSound } from "@/audio/SoundProvider";
import { DIFFICULTIES, type Difficulty } from "@/features/sudoku/types";
import { useGameStore } from "@/store/gameStore";

type DifficultyDetails = {
  label: string;
  description: string;
  intensity: number;
};

const difficultyDetails: Record<Difficulty, DifficultyDetails> = {
  easy: {
    label: "Easy",
    description: "Relaxed start",
    intensity: 1
  },
  medium: {
    label: "Medium",
    description: "Balanced puzzle",
    intensity: 2
  },
  hard: {
    label: "Hard",
    description: "Fewer clues",
    intensity: 3
  },
  expert: {
    label: "Expert",
    description: "Sharp focus",
    intensity: 4
  }
};

export default function DifficultyScreen() {
  const startNewGameAsync = useGameStore((state) => state.startNewGameAsync);

  return (
    <SafeAreaView className="flex-1 bg-canvas px-7">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 justify-center gap-10">
        <View className="items-center gap-4">
          <Text className="text-center text-5xl font-medium tracking-wide text-ink">
            Choose your level
          </Text>
          <Text className="max-w-sm text-center text-lg leading-7 text-muted">
            Pick the pace for your next grid.
          </Text>
        </View>

        <View className="w-full max-w-sm gap-3 self-center">
          {DIFFICULTIES.map((difficulty) => (
            <DifficultyTile
              key={difficulty}
              difficulty={difficulty}
              onPress={() => {
                router.replace("/game");
                void startNewGameAsync(difficulty);
              }}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function DifficultyTile({ difficulty, onPress }: { difficulty: Difficulty; onPress: () => void }) {
  const details = difficultyDetails[difficulty];
  const { playUiClick } = useSound();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start ${details.label} game`}
      hitSlop={8}
      onPress={() => {
        playUiClick();
        onPress();
      }}
      className="rounded-md border border-line bg-panel px-5 py-4 active:bg-accentSoft"
    >
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text className="text-xl font-medium tracking-wide text-ink">{details.label}</Text>
          <Text className="text-sm leading-5 text-muted">{details.description}</Text>
        </View>

        <View className="flex-row items-end gap-1.5">
          {[1, 2, 3, 4].map((level) => (
            <View
              key={level}
              className={`w-2 rounded-full ${
                level <= details.intensity ? "bg-accent" : "bg-strongLine"
              }`}
              style={{ height: 10 + level * 4 }}
            />
          ))}
        </View>
      </View>
    </Pressable>
  );
}
