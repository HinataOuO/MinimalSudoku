export const ALL_VALUES_MASK = 0b1111111110;

export function boxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

export function valueBit(value: number): number {
  return 1 << value;
}

export function maskSize(mask: number): number {
  let size = 0;
  let remaining = mask;

  while (remaining) {
    remaining &= remaining - 1;
    size += 1;
  }

  return size;
}

export function candidateMask(
  rowMasks: number[],
  colMasks: number[],
  boxMasks: number[],
  row: number,
  col: number
): number {
  return ALL_VALUES_MASK & ~(rowMasks[row] | colMasks[col] | boxMasks[boxIndex(row, col)]);
}
