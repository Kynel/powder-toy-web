import { Particle, Material, GRID_WIDTH, GRID_HEIGHT } from '../types/particle';

export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
}

export function isEmpty(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number): boolean {
  return isInBounds(x, y) && !grid[y][x] && !newGrid[y][x];
}

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function handleSand(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number, p: Particle) {
  // 아래로 이동
  if (isEmpty(grid, newGrid, x, y + 1)) {
    newGrid[y + 1][x] = p;
    return;
  }
  // 아래가 물이면 위치 교환 (단, 현재 셀에 이미 newGrid에 입자가 없을 때만)
  if (
    isInBounds(x, y + 1) &&
    grid[y + 1][x]?.type === 'WATER' &&
    !newGrid[y + 1][x] &&
    !newGrid[y][x]
  ) {
    newGrid[y + 1][x] = p;
    newGrid[y][x] = grid[y + 1][x];
    return;
  }
  // 대각선 아래
  for (const dx of shuffle([-1, 1])) {
    const nx = x + dx;
    const ny = y + 1;
    if (isEmpty(grid, newGrid, nx, ny)) {
      newGrid[ny][nx] = p;
      return;
    }
  }
  if (!newGrid[y][x]) newGrid[y][x] = p;
} 