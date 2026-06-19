import { Pressable, Text, View } from "react-native";

import { FilledCellValue } from "@/features/sudoku/types";
import { useGameStore } from "@/store/gameStore";

const numbers: FilledCellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function NumberPad() {
  const setCellValue = useGameStore((state) => state.setCellValue);
  const undoLastMove = useGameStore((state) => state.undoLastMove);
  const canUndo = useGameStore((state) => state.moveHistory.length > 0);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const puzzle = useGameStore((state) => state.puzzle);
  const disabled =
    selectedCell === null || puzzle?.givens[selectedCell.row][selectedCell.col] !== 0;

  return (
    <View className="gap-4">
      <View className="flex-row justify-start">
        <Pressable
          accessibilityLabel="Undo last move"
          accessibilityRole="button"
          disabled={!canUndo}
          hitSlop={8}
          onPress={undoLastMove}
          className={`items-center justify-center gap-1 rounded-lg px-4 py-2 ${
            canUndo ? "active:bg-accentSoft" : "opacity-40"
          }`}
        >
          <Text className="text-3xl leading-8 text-muted">↶</Text>
          <Text className="text-xs font-semibold text-muted">Undo</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-1.5">
        {numbers.map((number) => (
          <Pressable
            key={number}
            accessibilityLabel={`Enter ${number}`}
            accessibilityRole="button"
            disabled={disabled}
            hitSlop={4}
            onPress={() => setCellValue(number)}
            className={`h-16 flex-1 items-center justify-center rounded-lg border border-line bg-panel ${
              disabled ? "opacity-40" : "active:bg-accentSoft"
            }`}
          >
            <Text className="text-3xl font-semibold text-accent">{number}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
