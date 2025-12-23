export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum CellStatus {
  IDLE = 'IDLE',
  MOVING = 'MOVING', // Successfully flying off
  COLLIDED = 'COLLIDED', // Hit another block
}

export interface Cell {
  id: string; // Unique ID for React keys and animation tracking
  direction: Direction;
  status: CellStatus;
  x: number;
  y: number;
}

// A grid is a 2D array where null represents an empty space
export type Grid = (Cell | null)[][];

export enum GameStatus {
  HOME = 'HOME',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST', // Collision
  GAME_OVER = 'GAME_OVER', // Time ran out or no lives
  LOADING = 'LOADING',
}

export interface LevelSchema {
  levelId: string;
  gridSize: number;
  arrows: Array<{
    x: number;
    y: number;
    direction: Direction;
  }>;
  difficulty: 'easy' | 'medium' | 'hard';
  optimalMoveCount: number;
}

export interface LevelConfig {
  size: number;
  grid: (Direction | null)[][];
  optimalMoves?: number;
}