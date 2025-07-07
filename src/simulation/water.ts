import { Particle } from '../types/particle';
import { GRID_WIDTH, GRID_HEIGHT } from '../config/constants';
import { isInBounds, shuffle } from '../utils/common';

function isEmpty(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number): boolean {
  return isInBounds(x, y, GRID_WIDTH, GRID_HEIGHT) && !grid[y][x] && !newGrid[y][x];
}

export function handleWater(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number, p: Particle): void {
  // 속도가 있는 경우 (폭발로 날아간 파티클)
  if (p.vx !== undefined && p.vy !== undefined && (Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1)) {
    // 속도 방향으로 이동 시도
    const newX = Math.round(x + p.vx);
    const newY = Math.round(y + p.vy);
    
    if (isEmpty(grid, newGrid, newX, newY)) {
      // 속도 감소 (공기저항/마찰) - 격렬한 폭발 효과 유지
      const newVx = p.vx * 0.97; // 더 오래 날아가도록
      const newVy = p.vy * 0.97 + 0.04; // 중력 적용하면서 천천히 감속
      
      // 속도가 너무 작아지면 제거, 아니면 유지
      const newParticle = Math.abs(newVx) < 0.03 && Math.abs(newVy) < 0.03
        ? { type: p.type }
        : { ...p, vx: newVx, vy: newVy };
      
      newGrid[newY][newX] = newParticle;
      return;
    } else {
      // 충돌 시 격렬하게 튕김 (물은 가장 많이 튕김)
      const newParticle = { 
        ...p, 
        vx: -p.vx * 0.7, // 반대 방향으로 매우 강하게 튕김
        vy: -Math.abs(p.vy) * 0.6 // 위쪽으로 매우 강하게 튕김
      };
      
      // 원래 자리에 머물면서 속도 적용
      newGrid[y][x] = newParticle;
      return;
    }
  }
  
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