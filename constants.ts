
import { PuzzleConfig } from './types';

export const PUZZLES: PuzzleConfig[] = [
  { id: 0, color: '#ef4444', name: 'Ruby' },    // Red
  { id: 1, color: '#3b82f6', name: 'Sapphire' }, // Blue
  { id: 2, color: '#22c55e', name: 'Emerald' },  // Green
  { id: 3, color: '#eab308', name: 'Citrine' },  // Yellow
  { id: 4, color: '#a855f7', name: 'Amethyst' }, // Purple
  { id: 5, color: '#ec4899', name: 'Rose' },     // Pink
  { id: 6, color: '#f97316', name: 'Amber' },    // Orange
  { id: 7, color: '#06b6d4', name: 'Sky' },      // Cyan
  { id: 8, color: '#6366f1', name: 'Indigo' },   // Indigo
  { id: 9, color: '#14b8a6', name: 'Teal' },     // Teal
];

// 將座標改為直線排列：0, 1, 2, 3 全都在同一列 (y=0)
export const PIECE_OFFSETS = [
  { x: 0, y: 0 },   // Index 0: 最左
  { x: 1, y: 0 },   // Index 1: 左二
  { x: 2, y: 0 },   // Index 2: 右二
  { x: 3, y: 0 },   // Index 3: 最右
];
