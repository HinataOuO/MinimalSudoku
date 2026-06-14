import { Pressable, Text, useWindowDimensions, View } from "react-native";

import { CellPosition } from "@/features/sudoku/types";
import { useGameStore } from "@/store/gameStore";
import { colors } from "@/theme/colors";

function isRelated(a: CellPosition, b: CellPosition) {
  return (
    a.row === b.row ||
    a.col === b.col ||
    (Math.floor(a.row / 3) === Math.floor(b.row / 3) &&
      Math.floor(a.col / 3) === Math.floor(b.col / 3))
  );
}

export function SudokuGrid() {
  const { width } = useWindowDimensions();
  const puzzle = useGameStore((state) => state.puzzle);
  const userGrid = useGameStore((state) => state.userGrid);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const mistakes = useGameStore((state) => state.mistakes);
  const selectCell = useGameStore((state) => state.selectCell);

  if (!puzzle || !userGrid) {
    return null;
  }

  const size = Math.min(width - 32, 420);
  const cellSize = size / 9;

  return (
    <View
      className="self-center overflow-hidden rounded-lg bg-panel"
      style={{
        width: size,
        height: size,
        borderWidth: 2,
        borderColor: colors.strongLine
      }}
    >
      {userGrid.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row">
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
                          : colors.panel,
                  borderRightWidth: colIndex === 2 || colIndex === 5 ? 2 : 1,
                  borderBottomWidth: rowIndex === 2 || rowIndex === 5 ? 2 : 1,
                  borderColor:
                    colIndex === 2 ||
                    colIndex === 5 ||
                    rowIndex === 2 ||
                    rowIndex === 5
                      ? colors.strongLine
                      : colors.line
                }}
              >
                <Text
                  className={`font-bold ${fixed ? "text-ink" : "text-accent"} ${
                    mistake ? "text-danger" : ""
                  }`}
                  style={{ fontSize: Math.max(16, cellSize * 0.44) }}
                >
                  {value === 0 ? "" : value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
