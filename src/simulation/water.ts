import { Particle } from '../types/particle';
import { GRID_WIDTH, GRID_HEIGHT } from '../config/constants';
import { isInBounds, shuffle } from '../utils/common';

function isEmpty(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number): boolean {
  return isInBounds(x, y, GRID_WIDTH, GRID_HEIGHT) && !grid[y][x] && !newGrid[y][x];
}

export function handleWater(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number, p: Particle): void {
  // 속도가 있는 경우 (폭발로 날아간 파티클)
  if (p.vx !== undefined && p.vy !== undefined && (Math.abs(p.vx) > 0.05 || Math.abs(p.vy) > 0.05)) {
    // 물리 속성 기본값 설정 - 물은 공기저항이 크고 가벼움
    const airResistance = p.airResistance || 0.03;
    const gravityForce = p.gravity || 0.06;
    
    // 속도 방향으로 이동 시도
    const newX = Math.round(x + p.vx);
    const newY = Math.round(y + p.vy);
    
    if (isEmpty(grid, newGrid, newX, newY)) {
      // 실제 물리 법칙 적용 - 물은 공기저항이 크고 중력의 영향이 적음
      const newVx = p.vx * (1 - airResistance); // 더 큰 공기저항으로 빠른 감속
      const newVy = p.vy * (1 - airResistance) + gravityForce; // 더 작은 중력 영향
      
      // 속도가 너무 작아지면 일반 물로 전환
      const newParticle = Math.abs(newVx) < 0.03 && Math.abs(newVy) < 0.03
        ? { type: p.type } // vx, vy 속성 완전 제거하여 일반 물이 됨
        : { ...p, vx: newVx, vy: newVy };
      
      newGrid[newY][newX] = newParticle;
      return;
    } else {
      // 충돌 시 물의 특성에 맞는 반발 효과 - 더 많이 튀어오름
      const bounceFactorX = 0.3; // 반발 효과 감소
      const bounceFactorY = 0.2; // 반발 효과 감소
      
      // 표면의 종류에 따른 반발 차이
      const surfaceParticle = grid[newY]?.[newX];
      let actualBounceX = bounceFactorX;
      let actualBounceY = bounceFactorY;
      
      if (surfaceParticle?.type === 'SAND') {
        actualBounceX *= 0.5; // 모래에서는 흡수되어 덜 튀어오름
        actualBounceY *= 0.5;
      } else if (surfaceParticle?.type === 'STONE') {
        actualBounceX *= 1.2; // 돌에서는 매우 잘 튕김
        actualBounceY *= 1.2;
      } else if (surfaceParticle?.type === 'WATER') {
        actualBounceX *= 0.2; // 같은 물끼리는 거의 안 튕김
        actualBounceY *= 0.2;
      }
      
      const newVx = -p.vx * actualBounceX + (Math.random() - 0.5) * 0.05;
      const newVy = -Math.abs(p.vy) * actualBounceY;
      
      // 반발 속도가 너무 작으면 바로 일반 물로 전환
      const newParticle = Math.abs(newVx) < 0.05 && Math.abs(newVy) < 0.05
        ? { type: p.type } // 일반 물로 전환
        : { ...p, vx: newVx, vy: newVy };
      
      // 원래 자리에 머물면서 반발 속도 적용
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