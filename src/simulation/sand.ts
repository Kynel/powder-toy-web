import { Particle } from '../types/particle';
import { GRID_WIDTH, GRID_HEIGHT } from '../config/constants';
import { isInBounds, shuffle } from '../utils/common';

function isEmpty(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number): boolean {
  return isInBounds(x, y, GRID_WIDTH, GRID_HEIGHT) && !grid[y][x] && !newGrid[y][x];
}

export function handleSand(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number, p: Particle): void {
  // 아래로 이동
  if (isEmpty(grid, newGrid, x, y + 1)) {
    newGrid[y + 1][x] = { ...p };
    return;
  }
  
  // 아래가 물이면 위치 교환
  const belowParticle = grid[y + 1]?.[x];
  if (
    isInBounds(x, y + 1, GRID_WIDTH, GRID_HEIGHT) &&
    belowParticle?.type === 'WATER' &&
    !newGrid[y + 1][x] &&
    !newGrid[y][x]
  ) {
    // 중복 이동 방지 체크
    let alreadyMoved = false;
    if (y + 2 < GRID_HEIGHT && newGrid[y + 2][x] === belowParticle) {
      alreadyMoved = true;
    }
    if (!alreadyMoved) {
      newGrid[y + 1][x] = { ...p };
      newGrid[y][x] = { ...belowParticle };
    }
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
  
  if (!newGrid[y][x]) {
    newGrid[y][x] = { ...p };
  }
} 