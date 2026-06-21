import { Pressable, Text, View } from "react-native";
import { Eraser, Pencil, Undo2 } from "lucide-react-native";

import { useSound } from "@/audio/SoundProvider";
import { FilledCellValue } from "@/features/sudoku/types";
import { useGameStore } from "@/store/gameStore";
import { colors } from "@/theme/colors";

const numbers: FilledCellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function NumberPad() {
  const setCellValue = useGameStore((state) => state.setCellValue);
  const undoLastMove = useGameStore((state) => state.undoLastMove);
  const toggleNoteMode = useGameStore((state) => state.toggleNoteMode);
  const clearSelectedCellNotes = useGameStore((state) => state.clearSelectedCellNotes);
  const canUndo = useGameStore(
    (state) => state.status === "playing" && state.moveHistory.length > 0
  );
  const selectedCell = useGameStore((state) => state.selectedCell);
  const puzzle = useGameStore((state) => state.puzzle);
  const status = useGameStore((state) => state.status);
  const noteGrid = useGameStore((state) => state.noteGrid);
  const isNoteMode = useGameStore((state) => state.isNoteMode);
  const highlightNumber = useGameStore((state) => state.highlightNumber);
  const clearHighlightedNumber = useGameStore((state) => state.clearHighlightedNumber);
  const { playUiClick } = useSound();
  const numberPadDisabled = status !== "playing";
  const canEnterValue =
    status === "playing" &&
    puzzle !== null &&
    selectedCell !== null &&
    puzzle.givens[selectedCell.row][selectedCell.col] === 0;
  const selectedCellHasNotes =
    selectedCell !== null && noteGrid[selectedCell.row][selectedCell.col].length > 0;
  const canClearNotes = canEnterValue && selectedCellHasNotes;

  return (
    <View className="gap-4">
      <View className="flex-row justify-center gap-2">
        <Pressable
          accessibilityLabel="Undo last move"
          accessibilityRole="button"
          disabled={!canUndo}
          hitSlop={8}
          onPress={() => {
            playUiClick();
            undoLastMove();
          }}
          className={`items-center justify-center gap-1 rounded-md border border-line px-4 py-2 ${
            canUndo ? "bg-panel active:bg-accentSoft" : "bg-transparent opacity-35"
          }`}
        >
          <Undo2 color={colors.muted} size={24} strokeWidth={1.8} absoluteStrokeWidth />
          <Text className="text-xs font-medium uppercase tracking-wide text-muted">Undo</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Toggle note mode"
          accessibilityRole="button"
          disabled={status !== "playing"}
          hitSlop={8}
          onPress={() => {
            playUiClick();
            toggleNoteMode();
          }}
          className={`items-center justify-center gap-1 rounded-md border px-4 py-2 ${
            isNoteMode
              ? "border-accent bg-accentSoft"
              : status === "playing"
                ? "border-line bg-panel active:bg-accentSoft"
                : "border-line bg-transparent opacity-35"
          }`}
        >
          <Pencil
            color={isNoteMode ? colors.accent : colors.muted}
            size={24}
            strokeWidth={1.8}
            absoluteStrokeWidth
          />
          <Text
            className={`text-xs font-medium uppercase tracking-wide ${
              isNoteMode ? "text-accent" : "text-muted"
            }`}
          >
            Note
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Clear selected cell notes"
          accessibilityRole="button"
          disabled={!canClearNotes}
          hitSlop={8}
          onPress={() => {
            playUiClick();
            clearSelectedCellNotes();
          }}
          className={`items-center justify-center gap-1 rounded-md border border-line px-4 py-2 ${
            canClearNotes ? "bg-panel active:bg-accentSoft" : "bg-transparent opacity-35"
          }`}
        >
          <Eraser color={colors.muted} size={24} strokeWidth={1.8} absoluteStrokeWidth />
          <Text className="text-xs font-medium uppercase tracking-wide text-muted">Erase</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-2">
        {numbers.map((number) => (
          <Pressable
            key={number}
            accessibilityLabel={`Enter ${number}`}
            accessibilityRole="button"
            disabled={numberPadDisabled}
            delayLongPress={200}
            hitSlop={4}
            onLongPress={() => highlightNumber(number)}
            onPress={() => {
              if (canEnterValue) {
                setCellValue(number);
              }
            }}
            onPressOut={clearHighlightedNumber}
            className={`h-16 flex-1 items-center justify-center rounded-md border border-line bg-panelElevated ${
              numberPadDisabled ? "opacity-35" : "active:bg-accentSoft"
            }`}
          >
            <Text className="text-3xl font-medium text-accent">{number}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
