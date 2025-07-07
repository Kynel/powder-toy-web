export type Material = 'SAND' | 'WATER' | 'STONE';

export interface Particle {
  type: Material;
  vx?: number;
  vy?: number;
  resting?: boolean;
}

export interface MaterialConfig {
  color: number;
}

export const PARTICLE_TYPE: Record<Material, MaterialConfig> = {
  SAND: { color: 0xd2b48c },
  WATER: { color: 0x3399ff },
  STONE: { color: 0x888888 },
};

export const MATERIALS: Material[] = ['SAND', 'WATER', 'STONE']; 