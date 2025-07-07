import { Particle } from '../types/particle';
import { GRID_WIDTH, GRID_HEIGHT } from '../config/constants';
import { isInBounds, shuffle } from '../utils/common';

function isEmpty(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number): boolean {
  return isInBounds(x, y, GRID_WIDTH, GRID_HEIGHT) && !grid[y][x] && !newGrid[y][x];
}

export function handleWater(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number, p: Particle): void {
  // 위에 모래가 있으면 압력으로 인해 더 활발하게 움직임
  const aboveParticle = grid[y - 1]?.[x];
  const hasSandAbove = aboveParticle?.type === 'SAND';
  
  // 아래로 이동
  if (isEmpty(grid, newGrid, x, y + 1)) {
    newGrid[y + 1][x] = { ...p };
    return;
  }
  
  // 대각선 아래
  for (const dx of shuffle([-1, 1])) {
    const nx = x + dx;
    const ny = y + 1;
    if (isEmpty(grid, newGrid, nx, ny)) {
      newGrid[ny][nx] = { ...p };
      return;
    }
  }
  
  // 좌우로 흐름 (모래 압력이 있으면 더 넓게 흐름)
  const flowRange = hasSandAbove ? 2 : 1;
  for (let range = 1; range <= flowRange; range++) {
    for (const dir of shuffle([-1, 1])) {
      const nx = x + (dir * range);
      if (isEmpty(grid, newGrid, nx, y)) {
        newGrid[y][nx] = { ...p };
        return;
      }
    }
  }
  
  // 위로 이동 (모래 압력이 있을 때만)
  if (hasSandAbove) {
    for (const dx of shuffle([-1, 0, 1])) {
      const nx = x + dx;
      const ny = y - 1;
      if (isEmpty(grid, newGrid, nx, ny)) {
        newGrid[ny][nx] = { ...p };
        return;
      }
    }
  }
  
  newGrid[y][x] = { ...p };
} 