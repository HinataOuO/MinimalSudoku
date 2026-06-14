import { Pressable, Text, View } from "react-native";

import { FilledCellValue } from "@/features/sudoku/types";
import { useGameStore } from "@/store/gameStore";

const numbers: FilledCellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function NumberPad() {
  const setCellValue = useGameStore((state) => state.setCellValue);
  const clearSelectedCell = useGameStore((state) => state.clearSelectedCell);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const disabled = selectedCell === null;

  return (
    <View className="gap-3">
      <View className="flex-row justify-between gap-2">
        {numbers.map((number) => (
          <Pressable
            key={number}
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => setCellValue(number)}
            className={`h-11 flex-1 items-center justify-center rounded-lg border border-line bg-panel ${
              disabled ? "opacity-40" : "active:bg-accentSoft"
            }`}
          >
            <Text className="text-lg font-bold text-ink">{number}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={clearSelectedCell}
        className={`items-center rounded-lg border border-line bg-panel py-3 ${
          disabled ? "opacity-40" : "active:bg-dangerSoft"
        }`}
      >
        <Text className="font-semibold text-ink">Clear</Text>
      </Pressable>
    </View>
  );
}
