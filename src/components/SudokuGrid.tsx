import { Fragment, memo } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

import { CellPosition, CellValue, FilledCellValue } from "@/features/sudoku/types";
import { useGameStore } from "@/store/gameStore";
import { useThemeColors } from "@/theme/colors";

const lineWidth = 1;
const highlightBleed = lineWidth;
const highlightBorderWidth = 2;
const noteRows = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
] as const;

function isRelated(a: CellPosition, b: CellPosition) {
  return (
    a.row === b.row ||
    a.col === b.col ||
    (Math.floor(a.row / 3) === Math.floor(b.row / 3) &&
      Math.floor(a.col / 3) === Math.floor(b.col / 3))
  );
}

export function isProminentCell(
  row: number,
  col: number,
  value: CellValue,
  selectedCell: CellPosition | null,
  selectedValue: CellValue,
  highlightedNumber: FilledCellValue | null
) {
  if (highlightedNumber !== null) {
    return value === highlightedNumber;
  }

  const isSelected = selectedCell?.row === row && selectedCell?.col === col;
  const matchesSelectedValue = selectedValue !== 0 && value === selectedValue;

  return isSelected || matchesSelectedValue;
}

export function getHighlightedNumber(
  highlightedNumber: FilledCellValue | null,
  isRapidInputMode: boolean,
  rapidInputValue: FilledCellValue | null
): FilledCellValue | null {
  if (highlightedNumber !== null) {
    return highlightedNumber;
  }

  return isRapidInputMode ? rapidInputValue : null;
}

function SudokuGridComponent() {
  const { width, height } = useWindowDimensions();
  const puzzle = useGameStore((state) => state.puzzle);
  const userGrid = useGameStore((state) => state.userGrid);
  const noteGrid = useGameStore((state) => state.noteGrid);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const highlightedNumber = useGameStore((state) => state.highlightedNumber);
  const isRapidInputMode = useGameStore((state) => state.isRapidInputMode);
  const rapidInputValue = useGameStore((state) => state.rapidInputValue);
  const mistakes = useGameStore((state) => state.mistakes);
  const pressCell = useGameStore((state) => state.pressCell);
  const theme = useThemeColors();

  if (!puzzle || !userGrid) {
    return null;
  }

  const size = Math.min(width - 24, height * 0.56, 460);
  const cellSize = (size - lineWidth * 2 - lineWidth * 8) / 9;
  const boxLinePositions = [3, 6].map(
    (boundary) => lineWidth + boundary * cellSize + (boundary - 1) * lineWidth
  );
  const selectedValue = selectedCell ? userGrid[selectedCell.row][selectedCell.col] : 0;
  const activeHighlightedNumber = getHighlightedNumber(
    highlightedNumber,
    isRapidInputMode,
    rapidInputValue
  );

  return (
    <View
      className="self-center overflow-hidden rounded-sm"
      style={{
        width: size,
        height: size,
        padding: lineWidth,
        gap: lineWidth,
        backgroundColor: theme.line,
        shadowColor: theme.accent,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
        elevation: 1
      }}
    >
      {userGrid.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row" style={{ gap: lineWidth }}>
          {row.map((value, colIndex) => {
            const position = { row: rowIndex, col: colIndex };
            const fixed = puzzle.givens[rowIndex][colIndex] !== 0;
            const related = selectedCell ? isRelated(position, selectedCell) : false;
            const isProminentMatch = isProminentCell(
              rowIndex,
              colIndex,
              value,
              selectedCell,
              selectedValue,
              activeHighlightedNumber
            );
            const mistake = mistakes[`${rowIndex}-${colIndex}`] === true;
            const notes = noteGrid[rowIndex][colIndex];
            const noteGridSize = cellSize - 4;
            const noteCellSize = noteGridSize / 3;
            const noteFontSize = Math.max(8, cellSize * 0.2);

            return (
              <Pressable
                key={`${rowIndex}-${colIndex}`}
                accessibilityRole="button"
                onPress={() => pressCell(position)}
                className="items-center justify-center"
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: mistake
                    ? theme.dangerSoft
                    : isProminentMatch
                      ? theme.selectedCell
                      : related
                        ? theme.relatedCell
                        : fixed
                          ? theme.fixedCell
                          : theme.emptyCell
                }}
              >
                {value === 0 && notes.length > 0 ? (
                  <View style={{ width: noteGridSize, height: noteGridSize }}>
                    {noteRows.map((noteRow) => (
                      <View key={noteRow.join("-")} className="flex-row">
                        {noteRow.map((note) => (
                          <View
                            key={note}
                            className="items-center justify-center"
                            style={{ width: noteCellSize, height: noteCellSize }}
                          >
                            <Text
                              className="font-medium text-muted"
                              style={{
                                color: theme.muted,
                                fontSize: noteFontSize,
                                lineHeight: noteCellSize,
                                textAlign: "center"
                              }}
                            >
                              {notes.includes(note) ? note : ""}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text
                    className={`font-medium ${fixed ? "text-ink" : "text-accent"} ${
                      mistake ? "text-danger" : ""
                    }`}
                    style={{
                      fontSize: Math.max(20, cellSize * 0.58),
                      letterSpacing: 0.2,
                      lineHeight: Math.max(22, cellSize * 0.64),
                      color: mistake ? theme.danger : fixed ? theme.ink : theme.accent
                    }}
                  >
                    {value === 0 ? "" : value}
                  </Text>
                )}
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
            backgroundColor: theme.strongLine
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
            backgroundColor: theme.strongLine
          }}
        />
      ))}
      {userGrid.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          if (
            !isProminentCell(
              rowIndex,
              colIndex,
              value,
              selectedCell,
              selectedValue,
              activeHighlightedNumber
            )
          ) {
            return null;
          }

          const left = lineWidth + colIndex * (cellSize + lineWidth) - highlightBleed;
          const top = lineWidth + rowIndex * (cellSize + lineWidth) - highlightBleed;
          const highlightSize = cellSize + highlightBleed * 2;
          const highlightOffset = highlightSize - highlightBorderWidth;
          const highlightShadow = {
            shadowColor: theme.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.32,
            shadowRadius: 9,
            elevation: 3
          };

          return (
            <Fragment key={`highlight-${rowIndex}-${colIndex}`}>
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: highlightSize,
                  height: highlightBorderWidth,
                  backgroundColor: theme.accent,
                  ...highlightShadow
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left,
                  top: top + highlightOffset,
                  width: highlightSize,
                  height: highlightBorderWidth,
                  backgroundColor: theme.accent,
                  ...highlightShadow
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: highlightBorderWidth,
                  height: highlightSize,
                  backgroundColor: theme.accent,
                  ...highlightShadow
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: left + highlightOffset,
                  top,
                  width: highlightBorderWidth,
                  height: highlightSize,
                  backgroundColor: theme.accent,
                  ...highlightShadow
                }}
              />
            </Fragment>
          );
        })
      )}
    </View>
  );
}

export const SudokuGrid = memo(SudokuGridComponent);
