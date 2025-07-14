import { Particle } from '../types/particle';
import { GRID_WIDTH, GRID_HEIGHT } from '../config/constants';
import { isInBounds, shuffle } from '../utils/common';

function isEmpty(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number): boolean {
  return isInBounds(x, y, GRID_WIDTH, GRID_HEIGHT) && !grid[y][x] && !newGrid[y][x];
}

export function handleSand(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number, p: Particle): void {
  // 속도가 있는 경우 (폭발로 날아간 파티클)
  if (p.vx !== undefined && p.vy !== undefined && (Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1)) {
    // 물리 속성 기본값 설정
    const airResistance = p.airResistance || 0.02;
    const gravityForce = p.gravity || 0.08;
    
    // 속도 방향으로 이동 시도
    const newX = Math.round(x + p.vx);
    const newY = Math.round(y + p.vy);
    
    if (isEmpty(grid, newGrid, newX, newY)) {
      // 실제 물리 법칙 적용 - 공기저항과 중력
      const newVx = p.vx * (1 - airResistance); // 공기저항으로 감속
      const newVy = p.vy * (1 - airResistance) + gravityForce; // 중력과 공기저항 적용
      
      // 속도가 너무 작아지면 일반 모래로 전환
      const newParticle = Math.abs(newVx) < 0.03 && Math.abs(newVy) < 0.03
        ? { type: p.type }
        : { ...p, vx: newVx, vy: newVy };
      
      newGrid[newY][newX] = newParticle;
      return;
    } else {
      // 충돌 시 자연스러운 반발 효과
      const bounceFactorX = 0.4; // 수평 반발 계수
      const bounceFactorY = 0.3; // 수직 반발 계수
      
      // 표면의 종류에 따른 반발 차이
      const surfaceParticle = grid[newY]?.[newX];
      let actualBounceX = bounceFactorX;
      let actualBounceY = bounceFactorY;
      
      if (surfaceParticle?.type === 'WATER') {
        actualBounceX *= 0.5; // 물에서는 덜 튀어오름
        actualBounceY *= 0.5;
      } else if (surfaceParticle?.type === 'STONE') {
        actualBounceX *= 1.2; // 돌에서는 더 튀어오름
        actualBounceY *= 1.2;
      }
      
      const newParticle = { 
        ...p, 
        vx: -p.vx * actualBounceX + (Math.random() - 0.5) * 0.1, // 약간의 랜덤성
        vy: -Math.abs(p.vy) * actualBounceY // 위쪽으로 반발
      };
      
      // 원래 자리에 머물면서 반발 속도 적용
      newGrid[y][x] = newParticle;
      return;
    }
  }
  
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