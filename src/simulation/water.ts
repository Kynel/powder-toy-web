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
  // 좌우로 최대 3칸까지 흐름(단 한 번만)
  for (const dir of shuffle([-1, 1])) {
    for (let dist = 1; dist <= 3; dist++) {
      const nx = x + dir * dist;
      if (!isInBounds(nx, y)) break;
      if (isEmpty(grid, newGrid, nx, y)) {
        newGrid[y][nx] = p;
        moved = true;
        break;
      }
      // 아래가 비어있으면 더 이상 흐르지 않음
      if (isInBounds(nx, y + 1) && isEmpty(grid, newGrid, nx, y + 1)) break;
    }
    if (moved) break;
  }
  if (!moved) newGrid[y][x] = p;
} 