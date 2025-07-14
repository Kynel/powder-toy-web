import { Particle } from '../types/particle';
import { GRID_WIDTH, GRID_HEIGHT } from '../config/constants';
import { shuffle } from '../utils/common';
import { handleSand } from './sand';
import { handleWater } from './water';
import { handleExplosive, handleExplosionParticle } from './explosive';

function handleFire(
  grid: (Particle | null)[][],
  newGrid: (Particle | null)[][],
  x: number,
  y: number,
  particle: Particle
): void {
  // 수명이 설정되지 않았다면 초기화
  if (particle.lifetime === undefined) {
    particle.lifetime = 60 + Math.random() * 120; // 1~3초 정도
  }

  // 수명 감소
  particle.lifetime--;

  // 수명이 다했다면 사라짐
  if (particle.lifetime <= 0) {
    return;
  }

  // 화염은 위로 올라가는 효과
  const shouldMoveUp = Math.random() < 0.7; // 70% 확률로 위로
  const shouldSpread = Math.random() < 0.3; // 30% 확률로 좌우로 퍼짐

  if (shouldMoveUp && y > 0 && !grid[y - 1][x] && !newGrid[y - 1][x]) {
    // 위로 이동
    newGrid[y - 1][x] = { ...particle };
  } else if (shouldSpread) {
    // 좌우로 퍼지기
    const direction = Math.random() < 0.5 ? -1 : 1;
    const newX = x + direction;
    if (newX >= 0 && newX < GRID_WIDTH && !grid[y][newX] && !newGrid[y][newX]) {
      newGrid[y][newX] = { ...particle };
    } else {
      // 이동할 수 없으면 제자리에
      if (!newGrid[y][x]) {
        newGrid[y][x] = { ...particle };
      }
    }
  } else {
    // 제자리에
    if (!newGrid[y][x]) {
      newGrid[y][x] = { ...particle };
    }
  }
}

function handleWood(
  grid: (Particle | null)[][],
  newGrid: (Particle | null)[][],
  x: number,
  y: number,
  particle: Particle
): void {
  // 불에 노출 시간 초기화
  if (particle.fireExposure === undefined) {
    particle.fireExposure = 0;
  }
  
  // 연소 시간 초기화
  if (particle.burning && particle.burnTime === undefined) {
    particle.burnTime = 200 + Math.random() * 200; // 3~7초 정도 연소
  }

  // 이미 연소 중인 경우
  if (particle.burning) {
    particle.burnTime!--;
    
    // 연소 완료 시 사라짐
    if (particle.burnTime! <= 0) {
      return; // 나무가 완전히 타서 사라짐
    }
    
    // 연소 중인 나무는 주변으로 불을 번지게 함
    const spreadDirections = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (const [dx, dy] of spreadDirections) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
        const neighborParticle = grid[ny][nx];
        
        // 빈 공간에 불 생성 (10% 확률)
        if (!neighborParticle && !newGrid[ny][nx] && Math.random() < 0.1) {
          newGrid[ny][nx] = {
            type: 'FIRE',
            lifetime: 80 + Math.random() * 120,
          };
        }
        
        // 인접한 나무에 불 전파 (5% 확률)
        if (neighborParticle?.type === 'WOOD' && !neighborParticle.burning && Math.random() < 0.05) {
          neighborParticle.fireExposure = (neighborParticle.fireExposure || 0) + 10;
        }
      }
    }
    
    // 연기 생성 (위쪽으로)
    if (Math.random() < 0.3 && y > 0 && !grid[y - 1][x] && !newGrid[y - 1][x]) {
      newGrid[y - 1][x] = {
        type: 'SMOKE',
        vx: (Math.random() - 0.5) * 0.5, // 약간의 좌우 움직임
        vy: -0.5 - Math.random() * 0.5, // 위로 올라감
      };
    }
    
    // 연소 중인 나무는 제자리에 유지
    if (!newGrid[y][x]) {
      newGrid[y][x] = { ...particle };
    }
    return;
  }

  // 주변에 불이 있는지 확인
  let nearFire = false;
  const checkDirections = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  
  for (const [dx, dy] of checkDirections) {
    const nx = x + dx;
    const ny = y + dy;
    
    if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
      const neighborParticle = grid[ny][nx];
      if (neighborParticle?.type === 'FIRE' || (neighborParticle?.type === 'WOOD' && neighborParticle.burning)) {
        nearFire = true;
        break;
      }
    }
  }
  
  // 불 근처에 있으면 fireExposure 증가
  if (nearFire) {
    particle.fireExposure++;
    
    // 일정 시간 노출 후 랜덤하게 연소 시작
    if (particle.fireExposure > 60 && Math.random() < 0.02) { // 1초 노출 후 2% 확률
      particle.burning = true;
      particle.burnTime = 200 + Math.random() * 200;
    }
  } else {
    // 불이 없으면 천천히 fireExposure 감소
    if (particle.fireExposure > 0) {
      particle.fireExposure = Math.max(0, particle.fireExposure - 0.5);
    }
  }
  
  // 연소하지 않는 나무는 고정된 블록처럼 동작
  if (!newGrid[y][x]) {
    newGrid[y][x] = { ...particle };
  }
}

function handleSmoke(
  grid: (Particle | null)[][],
  newGrid: (Particle | null)[][],
  x: number,
  y: number,
  particle: Particle
): void {
  // 속도 초기화 - 위로만 올라가도록
  if (particle.vy === undefined) particle.vy = -0.5; // 위로 올라가는 속도
  
  // 위로 이동 시도
  if (y > 0 && !grid[y - 1][x] && !newGrid[y - 1][x]) {
    // 위쪽이 비어있으면 위로 이동
    newGrid[y - 1][x] = { 
      ...particle, 
      vx: 0,
      vy: Math.max(particle.vy - 0.01, -0.8) // 계속 가속
    };
    return;
  }
  
  // 위가 막혔으면 좌우로 한 칸씩 이동 후 다시 위로
  const directions = shuffle([[-1, 0], [1, 0]]);
  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y;
    
    if (nx >= 0 && nx < GRID_WIDTH && !grid[ny][nx] && !newGrid[ny][nx]) {
      newGrid[ny][nx] = { 
        ...particle, 
        vx: 0,
        vy: -0.3 // 옆으로 이동 후에도 위로 올라가려 함
      };
      return;
    }
  }
  
  // 아무곳도 갈 수 없으면 제자리에 (하지만 여전히 위로 올라가려는 속도 유지)
  if (!newGrid[y][x]) {
    newGrid[y][x] = { 
      ...particle, 
      vx: 0,
      vy: -0.2 // 계속 위로 올라가려 함
    };
  }
}

// 성능 최적화를 위해 order 배열을 한 번만 생성
let shuffleOrder: [number, number][] | null = null;

function getShuffleOrder(): [number, number][] {
  if (!shuffleOrder) {
    shuffleOrder = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        shuffleOrder.push([x, y]);
      }
    }
  }
  return shuffle([...shuffleOrder]);
}

export function stepSimulation(grid: (Particle | null)[][]): (Particle | null)[][] {
  const newGrid: (Particle | null)[][] = Array.from({ length: GRID_HEIGHT }, () => 
    Array(GRID_WIDTH).fill(null)
  );
  
  const order = getShuffleOrder();

  for (const [x, y] of order) {
    const particle = grid[y][x];
    if (!particle || newGrid[y][x]) continue;

    switch (particle.type) {
      case 'STONE':
        newGrid[y][x] = { ...particle };
        break;
      case 'WOOD': // 나무 연소 로직으로 변경
        handleWood(grid, newGrid, x, y, particle);
        break;
      case 'SAND':
        handleSand(grid, newGrid, x, y, particle);
        break;
      case 'WATER':
        handleWater(grid, newGrid, x, y, particle);
        break;
      case 'EXPLOSIVE':
        handleExplosive(grid, newGrid, x, y, particle);
        break;
      case 'EXPLOSION_WHITE':
      case 'EXPLOSION_YELLOW':
      case 'EXPLOSION_RED':
        handleExplosionParticle(grid, newGrid, x, y, particle);
        break;
      case 'FIRE':
        handleFire(grid, newGrid, x, y, particle);
        break;
      case 'SMOKE':
        handleSmoke(grid, newGrid, x, y, particle);
        break;
    }
  }
  
  return newGrid;
} 