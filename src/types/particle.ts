export type Material = 'SAND' | 'WATER' | 'STONE';

export interface Particle {
  type: Material;
  vx?: number;
  vy?: number;
  resting?: boolean;
}

export const PARTICLE_TYPE: Record<Material, { color: number }> = {
  SAND: { color: 0xd2b48c },
  WATER: { color: 0x3399ff },
  STONE: { color: 0x888888 },
};

export const CELL_SIZE = 4;
export const GRID_WIDTH = 120; // 480 / 4
export const GRID_HEIGHT = 90; // 360 / 4
export const WIDTH = CELL_SIZE * GRID_WIDTH;
export const HEIGHT = CELL_SIZE * GRID_HEIGHT; 