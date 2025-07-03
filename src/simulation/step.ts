import { Particle, Material, GRID_WIDTH, GRID_HEIGHT } from '../types/particle';
import { handleSand, isInBounds, isEmpty, shuffle } from './sand';
import { handleWater } from './water';

export function stepSimulation(grid: (Particle | null)[][]): (Particle | null)[][] {
  const newGrid: (Particle | null)[][] = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));
  const order: [number, number][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) for (let x = 0; x < GRID_WIDTH; x++) order.push([x, y]);
  shuffle(order);

  for (const [x, y] of order) {
    const p = grid[y][x];
    if (!p) continue;
    if (newGrid[y][x]) continue;
    if (p.type === 'STONE') {
      newGrid[y][x] = p;
      continue;
    }
    if (p.type === 'SAND') {
      handleSand(grid, newGrid, x, y, p);
      continue;
    }
    if (p.type === 'WATER') {
      handleWater(grid, newGrid, x, y, p);
      continue;
    }
  }
  return newGrid;
} 