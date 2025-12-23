
import { Direction, LevelConfig } from "../types";

// --- CONSTANTS & TYPES ---
const GRID_SIZE = 6; // Updated to 6x6 Grid

type SimpleGrid = (Direction | null)[][];

// --- SOLVER & VALIDATOR ---

// Check if a specific arrow can exit the grid without collision
// This checks against the CURRENT grid state.
const canExit = (grid: SimpleGrid, startX: number, startY: number, direction: Direction): boolean => {
  let dx = 0, dy = 0;
  if (direction === Direction.UP) dy = -1;
  if (direction === Direction.DOWN) dy = 1;
  if (direction === Direction.LEFT) dx = -1;
  if (direction === Direction.RIGHT) dx = 1;

  let cx = startX + dx;
  let cy = startY + dy;

  while (cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
    if (grid[cy][cx] !== null) return false; // Collision
    cx += dx;
    cy += dy;
  }
  return true;
};

// --- REVERSE PROCEDURAL GENERATOR ---

class Random {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  // Helper to shuffle array
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

const ALL_DIRECTIONS = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];

// Generates a level by working BACKWARDS from the solution.
const generateProceduralLevel = (difficulty: 'easy' | 'medium' | 'hard', seed: number, levelNum: number): LevelConfig => {
  const rng = new Random(seed);
  
  // Configuration based on difficulty for 6x6 grid (36 cells)
  let targetBlockCount = 0;
  const progression = Math.min(levelNum, 200); 

  switch(difficulty) {
    case 'easy': 
      // Adjusted for 36 cells: Start 10, scale to ~16
      targetBlockCount = 10 + Math.floor(progression * 0.03) + Math.floor(rng.next() * 5); 
      break; 
    case 'medium': 
      // Adjusted for 36 cells: Start 16, scale to ~24
      targetBlockCount = 16 + Math.floor(progression * 0.04) + Math.floor(rng.next() * 6); 
      break;
    case 'hard': 
      // Adjusted for 36 cells: Start 22, scale to ~30
      targetBlockCount = 22 + Math.floor(progression * 0.04) + Math.floor(rng.next() * 8); 
      break; 
  }

  // Cap density to ensure it's solvable (33/36 is quite full)
  targetBlockCount = Math.min(targetBlockCount, 33);

  // Initialize empty grid
  const grid: SimpleGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  let placedCount = 0;

  // Track all empty positions
  let emptyPositions: {x: number, y: number}[] = [];
  for(let y=0; y<GRID_SIZE; y++) {
    for(let x=0; x<GRID_SIZE; x++) {
      emptyPositions.push({x, y});
    }
  }

  // Shuffle initially
  rng.shuffle(emptyPositions);
  
  let attempts = 0;
  const MAX_ATTEMPTS = targetBlockCount * 40; 

  while (placedCount < targetBlockCount && attempts < MAX_ATTEMPTS) {
    attempts++;
    
    if (emptyPositions.length === 0) break;

    // Pick a candidate index
    const idx = Math.floor(rng.next() * Math.min(emptyPositions.length, 15)); 
    const candidatePos = emptyPositions[idx];
    
    const directions = rng.shuffle([...ALL_DIRECTIONS]);
    
    let placed = false;

    for (const dir of directions) {
        if (canExit(grid, candidatePos.x, candidatePos.y, dir)) {
            grid[candidatePos.y][candidatePos.x] = dir;
            placedCount++;
            emptyPositions.splice(idx, 1);
            placed = true;
            break; 
        }
    }
  }

  return { size: GRID_SIZE, grid, optimalMoves: placedCount };
};

// --- MAIN EXPORT ---

export const generateLevel = async (
  difficulty: 'easy' | 'medium' | 'hard', 
  levelNum: number,
  seedModifier: number = 0
): Promise<LevelConfig> => {
  const difficultyOffset = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 100000 : 200000;
  const seed = (levelNum * 9973) + difficultyOffset + (seedModifier * 777); 
  
  return generateProceduralLevel(difficulty, seed, levelNum);
};
