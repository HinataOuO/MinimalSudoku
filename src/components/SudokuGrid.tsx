import { Pressable, Text, useWindowDimensions, View } from "react-native";

import { CellPosition } from "@/features/sudoku/types";
import { useGameStore } from "@/store/gameStore";
import { colors } from "@/theme/colors";

const lineWidth = 1;

function isRelated(a: CellPosition, b: CellPosition) {
  return (
    a.row === b.row ||
    a.col === b.col ||
    (Math.floor(a.row / 3) === Math.floor(b.row / 3) &&
      Math.floor(a.col / 3) === Math.floor(b.col / 3))
  );
}

export function SudokuGrid() {
  const { width, height } = useWindowDimensions();
  const puzzle = useGameStore((state) => state.puzzle);
  const userGrid = useGameStore((state) => state.userGrid);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const mistakes = useGameStore((state) => state.mistakes);
  const selectCell = useGameStore((state) => state.selectCell);

  if (!puzzle || !userGrid) {
    return null;
  }

  const size = Math.min(width - 12, height * 0.56, 460);
  const cellSize = (size - lineWidth * 2 - lineWidth * 8) / 9;
  const boxLinePositions = [3, 6].map(
    (boundary) => lineWidth + boundary * cellSize + (boundary - 1) * lineWidth
  );

  return (
    <View
      className="self-center overflow-hidden rounded-md"
      style={{
        width: size,
        height: size,
        padding: lineWidth,
        gap: lineWidth,
        backgroundColor: colors.line
      }}
    >
      {userGrid.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row" style={{ gap: lineWidth }}>
          {row.map((value, colIndex) => {
            const position = { row: rowIndex, col: colIndex };
            const isSelected =
              selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const fixed = puzzle.givens[rowIndex][colIndex] !== 0;
            const related = selectedCell ? isRelated(position, selectedCell) : false;
            const mistake = mistakes[`${rowIndex}-${colIndex}`] === true;

            return (
              <Pressable
                key={`${rowIndex}-${colIndex}`}
                accessibilityRole="button"
                onPress={() => selectCell(position)}
                className="items-center justify-center"
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: mistake
                    ? colors.dangerSoft
                    : isSelected
                      ? colors.selectedCell
                      : fixed
                        ? colors.fixedCell
                        : related
                          ? colors.relatedCell
                          : colors.panel
                }}
              >
                <Text
                  className={`font-semibold ${fixed ? "text-ink" : "text-accent"} ${
                    mistake ? "text-danger" : ""
                  }`}
                  style={{ fontSize: Math.max(18, cellSize * 0.56) }}
                >
                  {value === 0 ? "" : value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      {boxLinePositions.map((position) => (
        <View
          key={`vertical-${position}`}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: position,
            top: 0,
            bottom: 0,
            width: lineWidth,
            backgroundColor: colors.strongLine
          }}
        />
      ))}
      {boxLinePositions.map((position) => (
        <View
          key={`horizontal-${position}`}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: position,
            height: lineWidth,
            backgroundColor: colors.strongLine
          }}
        />
      ))}
    </View>
  );
}
