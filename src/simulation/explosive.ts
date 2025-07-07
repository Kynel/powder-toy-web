import { Particle } from '../types/particle';
import { GRID_WIDTH, GRID_HEIGHT } from '../config/constants';
import { isInBounds, shuffle } from '../utils/common';

function isEmpty(grid: (Particle | null)[][], newGrid: (Particle | null)[][], x: number, y: number): boolean {
  return isInBounds(x, y, GRID_WIDTH, GRID_HEIGHT) && !grid[y][x] && !newGrid[y][x];
}

export function handleExplosive(
  grid: (Particle | null)[][], 
  newGrid: (Particle | null)[][], 
  x: number, 
  y: number, 
  particle: Particle
): void {
  // 도화선이 설정되지 않았다면 초기화 (마우스 클릭 후 2.5초 후 폭발)
  if (particle.fuse === undefined) {
    particle.fuse = 150; // 약 2.5초 (60fps 기준)
  }

  // 도화선 감소
  particle.fuse--;

  // 폭발 시간이 되었다면 폭발
  if (particle.fuse <= 0) {
    explode(newGrid, x, y);
    return;
  }

  // 중력 적용 - 아래로 이동 (빈 공간)
  if (isEmpty(grid, newGrid, x, y + 1)) {
    newGrid[y + 1][x] = { ...particle };
    return;
  }
  
  // 아래가 물이면 물을 위로 보내고 폭발물은 아래로 (가라앉기)
  const belowParticle = grid[y + 1]?.[x];
  if (
    isInBounds(x, y + 1, GRID_WIDTH, GRID_HEIGHT) &&
    belowParticle?.type === 'WATER' &&
    !newGrid[y + 1][x] &&
    !newGrid[y][x]
  ) {
    // 물을 위로 보내고 폭발물은 아래로
    newGrid[y + 1][x] = { ...particle };
    newGrid[y][x] = { ...belowParticle };
    return;
  }
  
  // 대각선 아래로 이동
  for (const dx of shuffle([-1, 1])) {
    const nx = x + dx;
    const ny = y + 1;
    
    // 대각선 아래가 빈 공간이면 이동
    if (isEmpty(grid, newGrid, nx, ny)) {
      newGrid[ny][nx] = { ...particle };
      return;
    }
    
    // 대각선 아래가 물이면 물을 위로 보내고 폭발물은 아래로
    const diagonalParticle = grid[ny]?.[nx];
    if (
      isInBounds(nx, ny, GRID_WIDTH, GRID_HEIGHT) &&
      diagonalParticle?.type === 'WATER' &&
      !newGrid[ny][nx] &&
      !newGrid[y][x]
    ) {
      newGrid[ny][nx] = { ...particle };
      newGrid[y][x] = { ...diagonalParticle };
      return;
    }
  }

  // 이동할 수 없으면 제자리에 (도화선은 계속 줄어듦)
  if (!newGrid[y][x]) {
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
  const explosionRadius = 12; // 폭발 범위를 더 크게 확장
  const scatteredParticles: Array<{particle: Particle, x: number, y: number, vx: number, vy: number}> = [];
  
  // 1단계: 폭발 범위 내 파티클 처리
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
            // 모래는 더 쉽게 파이도록 임계값 낮춤
            if (intensity > 0.1) {
              // 모든 모래가 사방으로 비산 (양이 보존됨)
              const angle = Math.atan2(dy, dx);
              const force = intensity * 5 + 2; // 더욱 강한 폭발력
              // 위쪽으로 더 많이 튀어오르도록 조정
              const adjustedVy = Math.sin(angle) * force - 1.5; // 위쪽 편향 강화
              scatteredParticles.push({
                particle: { ...existingParticle, vx: Math.cos(angle) * force, vy: adjustedVy },
                x: x,
                y: y,
                vx: Math.cos(angle) * force,
                vy: adjustedVy
              });
              grid[y][x] = null; // 원래 위치에서 제거 (구멍 생성)
            }
            break;
          case 'WATER':
            if (intensity > 0.1) {
              // 물의 30% 증발 효과
              if (Math.random() < 0.3) {
                grid[y][x] = null; // 30% 확률로 증발
              } else {
                // 나머지 70%는 사방으로 퍼져나감
                const angle = Math.atan2(dy, dx);
                const force = intensity * 6 + 2.5; // 물은 더욱 강하게 퍼짐
                // 위쪽으로 더 많이 튀어오르도록 조정
                const adjustedVy = Math.sin(angle) * force - 2; // 위쪽 편향 더 강하게
                scatteredParticles.push({
                  particle: { ...existingParticle, vx: Math.cos(angle) * force, vy: adjustedVy },
                  x: x,
                  y: y,
                  vx: Math.cos(angle) * force,
                  vy: adjustedVy
                });
                grid[y][x] = null; // 원래 위치에서 제거
              }
            }
            break;
          case 'STONE':
            // 벽은 덜 파임 (강한 폭발력에만 파괴)
            if (intensity > 0.8) {
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
      
      // 허공에 강력한 폭발 효과 파티클 생성
      if (!existingParticle && Math.random() < intensity * 1.5) {
        const particleTypes = ['EXPLOSION_WHITE', 'EXPLOSION_YELLOW', 'EXPLOSION_RED'] as const;
        const randomType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        grid[y][x] = {
          type: randomType,
          lifetime: Math.floor(40 + Math.random() * 80), // 더 오래 지속되는 폭발 효과
        };
      }
    }
  }
  
  // 2단계: 비산된 파티클들을 새로운 위치에 배치
  for (const scattered of scatteredParticles) {
    // 격렬한 폭발에 맞게 더 멀리 배치
    const newX = Math.round(scattered.x + scattered.vx * 1.2); // 더 멀리 날아감
    const newY = Math.round(scattered.y + scattered.vy * 1.2);
    
    // 경계 체크 및 빈 공간 확인
    if (newX >= 0 && newX < GRID_WIDTH && newY >= 0 && newY < GRID_HEIGHT && !grid[newY][newX]) {
      // 속도를 그대로 유지해서 계속 날아가도록
      grid[newY][newX] = scattered.particle;
    } else {
      // 새 위치에 놓을 수 없으면 가까운 빈 공간 찾기
      let placed = false;
      for (let radius = 1; radius <= 3 && !placed; radius++) { // 탐색 범위 확장
        for (let dy = -radius; dy <= radius && !placed; dy++) {
          for (let dx = -radius; dx <= radius && !placed; dx++) {
            const tryX = scattered.x + dx;
            const tryY = scattered.y + dy;
            if (tryX >= 0 && tryX < GRID_WIDTH && tryY >= 0 && tryY < GRID_HEIGHT && !grid[tryY][tryX]) {
              grid[tryY][tryX] = scattered.particle;
              placed = true;
            }
          }
        }
      }
    }
  }
} 