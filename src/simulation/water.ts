import { Particle } from '../types/particle';
import { isInBounds, isEmpty, shuffle } from './sand';

export function handleWater(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number, p: Particle) {
  let moved = false;
  // 아래로 이동
  if (isEmpty(grid, newGrid, x, y + 1)) {
    newGrid[y + 1][x] = p;
    return;
  }
  // 대각선 아래
  for (const dx of shuffle([-1, 1])) {
    const nx = x + dx;
    const ny = y + 1;
    if (isEmpty(grid, newGrid, nx, ny)) {
      newGrid[ny][nx] = p;
      moved = true;
      break;
    }
  }
  if (moved) return;
  // 좌우로 1칸만 흐름
  for (const dir of shuffle([-1, 1])) {
    const nx = x + dir;
    if (isEmpty(grid, newGrid, nx, y)) {
      newGrid[y][nx] = p;
      moved = true;
      break;
    }
  }
  if (!moved) newGrid[y][x] = p;
} 