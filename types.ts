
export interface Vector2 {
  x: number;
  y: number;
}

export interface PuzzleConfig {
  id: number;
  color: string;
  name: string;
}

export interface Piece {
  id: string; // Unique instance ID
  puzzleId: number; // 0-9
  pieceIndex: number; // 0-3 (Linear: 0:Left, 1:Mid-L, 2:Mid-R, 3:Right)
  position: Vector2;
  rotation: number; // 0, 90, 180, 270 degrees
  groupId: string | null; // ID for pieces that are snapped together
}

export const PIECE_SIZE = 120;
export const SNAP_THRESHOLD = 80; // 加大吸附範圍，讓操作更輕鬆
