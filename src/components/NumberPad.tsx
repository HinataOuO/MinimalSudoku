import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { Eraser, Pencil, Undo2, Zap } from "lucide-react-native";

import { useSound } from "@/audio/SoundProvider";
import { FilledCellValue, SudokuGrid, SudokuPuzzle } from "@/features/sudoku/types";
import { isNumberCompleted } from "@/features/sudoku/validator";
import { useGameStore } from "@/store/gameStore";
import { useThemeColors } from "@/theme/colors";

const numbers: FilledCellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function getCompletedNumberPadValues(
  values: FilledCellValue[],
  puzzle: SudokuPuzzle | null,
  userGrid: SudokuGrid | null,
  arcadeModeEnabled: boolean
): FilledCellValue[] {
  if (!arcadeModeEnabled || puzzle === null || userGrid === null) {
    return [];
  }

  return values.filter((number) => isNumberCompleted(userGrid, puzzle.solution, number));
}

function NumberPadComponent() {
  const setCellValue = useGameStore((state) => state.setCellValue);
  const undoLastMove = useGameStore((state) => state.undoLastMove);
  const toggleNoteMode = useGameStore((state) => state.toggleNoteMode);
  const toggleRapidInputMode = useGameStore((state) => state.toggleRapidInputMode);
  const setRapidInputValue = useGameStore((state) => state.setRapidInputValue);
  const clearSelectedCellNotes = useGameStore((state) => state.clearSelectedCellNotes);
  const canUndo = useGameStore(
    (state) => state.status === "playing" && state.moveHistory.length > 0
  );
  const selectedCell = useGameStore((state) => state.selectedCell);
  const puzzle = useGameStore((state) => state.puzzle);
  const userGrid = useGameStore((state) => state.userGrid);
  const status = useGameStore((state) => state.status);
  const noteGrid = useGameStore((state) => state.noteGrid);
  const isNoteMode = useGameStore((state) => state.isNoteMode);
  const isRapidInputMode = useGameStore((state) => state.isRapidInputMode);
  const rapidInputValue = useGameStore((state) => state.rapidInputValue);
  const arcadeModeEnabled = useGameStore((state) => state.arcadeModeEnabled);
  const highlightNumber = useGameStore((state) => state.highlightNumber);
  const clearHighlightedNumber = useGameStore((state) => state.clearHighlightedNumber);
  const { playUiClick } = useSound();
  const theme = useThemeColors();
  const numberPadDisabled = status !== "playing";
  const canEnterValue =
    status === "playing" &&
    puzzle !== null &&
    userGrid !== null &&
    selectedCell !== null &&
    puzzle.givens[selectedCell.row][selectedCell.col] === 0 &&
    userGrid[selectedCell.row][selectedCell.col] !==
      puzzle.solution[selectedCell.row][selectedCell.col];
  const selectedCellHasNotes =
    selectedCell !== null && noteGrid[selectedCell.row][selectedCell.col].length > 0;
  const canClearNotes = canEnterValue && selectedCellHasNotes;
  const completedNumbers = getCompletedNumberPadValues(
    numbers,
    puzzle,
    userGrid,
    arcadeModeEnabled
  );

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
          className={`flex-1 items-center justify-center gap-1 rounded-md border border-line px-2 py-2 ${
            canUndo ? "bg-panel active:bg-accentSoft" : "bg-transparent opacity-35"
          }`}
          style={{
            backgroundColor: canUndo ? theme.panel : "transparent",
            borderColor: theme.line
          }}
        >
          <Undo2 color={theme.muted} size={24} strokeWidth={1.8} absoluteStrokeWidth />
          <Text
            className="text-xs font-medium uppercase tracking-wide text-muted"
            style={{ color: theme.muted }}
          >
            Undo
          </Text>
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
          className={`flex-1 items-center justify-center gap-1 rounded-md border px-2 py-2 ${
            isNoteMode
              ? "border-accent bg-accentSoft"
              : status === "playing"
                ? "border-line bg-panel active:bg-accentSoft"
                : "border-line bg-transparent opacity-35"
          }`}
          style={{
            backgroundColor: isNoteMode
              ? theme.accentSoft
              : status === "playing"
                ? theme.panel
                : "transparent",
            borderColor: isNoteMode ? theme.accent : theme.line
          }}
        >
          <Pencil
            color={isNoteMode ? theme.accent : theme.muted}
            size={24}
            strokeWidth={1.8}
            absoluteStrokeWidth
          />
          <Text
            className={`text-xs font-medium uppercase tracking-wide ${
              isNoteMode ? "text-accent" : "text-muted"
            }`}
            style={{ color: isNoteMode ? theme.accent : theme.muted }}
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
          className={`flex-1 items-center justify-center gap-1 rounded-md border border-line px-2 py-2 ${
            canClearNotes ? "bg-panel active:bg-accentSoft" : "bg-transparent opacity-35"
          }`}
          style={{
            backgroundColor: canClearNotes ? theme.panel : "transparent",
            borderColor: theme.line
          }}
        >
          <Eraser color={theme.muted} size={24} strokeWidth={1.8} absoluteStrokeWidth />
          <Text
            className="text-xs font-medium uppercase tracking-wide text-muted"
            style={{ color: theme.muted }}
          >
            Erase
          </Text>
        </Pressable>
        {arcadeModeEnabled ? (
          <Pressable
            accessibilityLabel="Toggle rapid input mode"
            accessibilityRole="button"
            disabled={status !== "playing"}
            hitSlop={8}
            onPress={() => {
              playUiClick();
              toggleRapidInputMode();
            }}
            className={`flex-1 items-center justify-center gap-1 rounded-md border px-2 py-2 ${
              isRapidInputMode
                ? "border-accent bg-accentSoft"
                : status === "playing"
                  ? "border-line bg-panel active:bg-accentSoft"
                  : "border-line bg-transparent opacity-35"
            }`}
            style={{
              backgroundColor: isRapidInputMode
                ? theme.accentSoft
                : status === "playing"
                  ? theme.panel
                  : "transparent",
              borderColor: isRapidInputMode ? theme.accent : theme.line
            }}
          >
            <Zap
              color={isRapidInputMode ? theme.accent : theme.muted}
              size={24}
              strokeWidth={1.8}
              absoluteStrokeWidth
            />
            <Text
              className={`text-xs font-medium uppercase tracking-wide ${
                isRapidInputMode ? "text-accent" : "text-muted"
              }`}
              style={{ color: isRapidInputMode ? theme.accent : theme.muted }}
            >
              Rapid
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        {numbers.map((number) => {
          const numberCompleted = completedNumbers.includes(number);
          const disabled = numberPadDisabled || numberCompleted;
          const rapidNumberSelected = isRapidInputMode && rapidInputValue === number;

          return (
            <Pressable
              key={number}
              accessibilityLabel={
                isRapidInputMode ? `Select ${number} for rapid input` : `Enter ${number}`
              }
              accessibilityRole="button"
              accessibilityState={{ disabled, selected: rapidNumberSelected }}
              disabled={disabled}
              delayLongPress={200}
              hitSlop={4}
              onLongPress={() => highlightNumber(number)}
              onPress={() => {
                if (isRapidInputMode) {
                  setRapidInputValue(number);
                } else if (canEnterValue && !numberCompleted) {
                  setCellValue(number);
                }
              }}
              onPressOut={clearHighlightedNumber}
              className={`h-16 flex-1 items-center justify-center rounded-md border ${
                rapidNumberSelected
                  ? "border-accent bg-accentSoft"
                  : "border-line bg-panelElevated"
              } ${
                disabled ? "opacity-35" : "active:bg-accentSoft"
              }`}
              style={{
                backgroundColor: rapidNumberSelected ? theme.accentSoft : theme.panelElevated,
                borderColor: rapidNumberSelected ? theme.accent : theme.line
              }}
            >
              <Text
                className={`text-3xl font-medium ${
                  numberCompleted ? "text-muted" : "text-accent"
                }`}
                style={{ color: numberCompleted ? theme.muted : theme.accent }}
              >
                {number}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const NumberPad = memo(NumberPadComponent);
