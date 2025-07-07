import { Particle } from '../types/particle';
import { GRID_WIDTH, GRID_HEIGHT } from '../config/constants';
import { isInBounds, shuffle } from '../utils/common';

function isEmpty(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number): boolean {
  return isInBounds(x, y, GRID_WIDTH, GRID_HEIGHT) && !grid[y][x] && !newGrid[y][x];
}

export function handleSand(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number, p: Particle): void {
  // 아래로 이동 (빈 공간)
  if (isEmpty(grid, newGrid, x, y + 1)) {
    newGrid[y + 1][x] = { ...p };
    return;
  }
  
  // 아래가 물이면 확률적으로 통과 (30% 확률)
  const belowParticle = grid[y + 1]?.[x];
  if (
    isInBounds(x, y + 1, GRID_WIDTH, GRID_HEIGHT) &&
    belowParticle?.type === 'WATER' &&
    !newGrid[y + 1][x] &&
    !newGrid[y][x] &&
    Math.random() < 0.3 // 30% 확률로 통과
  ) {
    // 물을 위로 보내고 모래는 아래로
    newGrid[y + 1][x] = { ...p };
    newGrid[y][x] = { ...belowParticle };
    return;
  }
  
  // 대각선 아래로 이동
  for (const dx of shuffle([-1, 1])) {
    const nx = x + dx;
    const ny = y + 1;
    
    // 대각선 아래가 빈 공간이면 이동
    if (isEmpty(grid, newGrid, nx, ny)) {
      newGrid[ny][nx] = { ...p };
      return;
    }
    
    // 대각선 아래가 물이면 확률적으로 통과 (20% 확률)
    const diagonalParticle = grid[ny]?.[nx];
    if (
      isInBounds(nx, ny, GRID_WIDTH, GRID_HEIGHT) &&
      diagonalParticle?.type === 'WATER' &&
      !newGrid[ny][nx] &&
      !newGrid[y][x] &&
      Math.random() < 0.2 // 20% 확률로 통과
    ) {
      newGrid[ny][nx] = { ...p };
      newGrid[y][x] = { ...diagonalParticle };
      return;
    }
  }
  
  // 이동할 수 없으면 제자리에
  if (!newGrid[y][x]) {
    newGrid[y][x] = { ...p };
  }
} 