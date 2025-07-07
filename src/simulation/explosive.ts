import { Particle } from '../types/particle';
import { GRID_WIDTH, GRID_HEIGHT } from '../config/constants';

export function handleExplosive(
  grid: (Particle | null)[][], 
  newGrid: (Particle | null)[][], 
  x: number, 
  y: number, 
  particle: Particle
): void {
  // 도화선이 설정되지 않았다면 초기화 (마우스 클릭 후 3초 후 폭발)
  if (particle.fuse === undefined) {
    particle.fuse = 180; // 약 3초 (60fps 기준)
  }

  // 도화선 감소
  particle.fuse--;

  // 폭발 시간이 되었다면 폭발
  if (particle.fuse <= 0) {
    explode(newGrid, x, y);
  } else {
    // 아직 폭발하지 않았다면 그 자리에 남아있음
    newGrid[y][x] = { ...particle };
  }
}

export function handleExplosionParticle(
  grid: (Particle | null)[][], 
  newGrid: (Particle | null)[][], 
  x: number, 
  y: number, 
  particle: Particle
): void {
  // 수명이 설정되지 않았다면 초기화
  if (particle.lifetime === undefined) {
    particle.lifetime = 30 + Math.random() * 30; // 0.5~1초 정도
  }

  // 수명 감소
  particle.lifetime--;

  // 수명이 다했다면 사라짐
  if (particle.lifetime <= 0) {
    return;
  }

  // 폭발 파티클은 약간 떠다니는 효과
  const newX = x + (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.7 ? 1 : 0);
  const newY = y - (Math.random() > 0.6 ? 1 : 0); // 위로 약간 올라감

  if (newX >= 0 && newX < GRID_WIDTH && newY >= 0 && newY < GRID_HEIGHT && !newGrid[newY][newX]) {
    newGrid[newY][newX] = { ...particle };
  } else {
    newGrid[y][x] = { ...particle };
  }
}

function explode(grid: (Particle | null)[][], centerX: number, centerY: number): void {
  const explosionRadius = 8;
  
  for (let dy = -explosionRadius; dy <= explosionRadius; dy++) {
    for (let dx = -explosionRadius; dx <= explosionRadius; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;
      if (distance > explosionRadius) continue;
      
      const existingParticle = grid[y][x];
      const intensity = 1 - (distance / explosionRadius); // 중심에서 멀수록 약해짐
      
      if (existingParticle) {
        switch (existingParticle.type) {
          case 'SAND':
            // 모래는 홈을 파임 (강한 폭발력)
            if (intensity > 0.3) {
              grid[y][x] = null;
            }
            break;
          case 'WATER':
            // 물은 첨벙거리는 효과 (완전히 제거)
            if (intensity > 0.2) {
              grid[y][x] = null;
            }
            break;
          case 'STONE':
            // 벽은 덜 파임 (강한 폭발력에만 파괴)
            if (intensity > 0.7) {
              grid[y][x] = null;
            }
            break;
          case 'EXPLOSIVE':
            // 다른 폭발물에 연쇄 폭발
            if (intensity > 0.5) {
              grid[y][x] = { type: 'EXPLOSIVE', fuse: 10 }; // 즉시 폭발하도록
            }
            break;
        }
      }
      
      // 허공에 폭발 효과 파티클 생성
      if (!existingParticle && Math.random() < intensity * 0.8) {
        const particleTypes = ['EXPLOSION_WHITE', 'EXPLOSION_YELLOW', 'EXPLOSION_RED'] as const;
        const randomType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        grid[y][x] = {
          type: randomType,
          lifetime: Math.floor(20 + Math.random() * 40),
        };
      }
    }
  }
} 