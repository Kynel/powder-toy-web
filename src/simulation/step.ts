import { Particle } from '../types/particle';
import { GRID_WIDTH, GRID_HEIGHT } from '../config/constants';
import { shuffle } from '../utils/common';
import { handleSand } from './sand';
import { handleWater } from './water';
import { handleExplosive, handleExplosionParticle } from './explosive';

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
    }
  }
  
  return newGrid;
} 