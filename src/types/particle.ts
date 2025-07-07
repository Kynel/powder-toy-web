export type Material = 'SAND' | 'WATER' | 'STONE' | 'EXPLOSIVE' | 'EXPLOSION_WHITE' | 'EXPLOSION_YELLOW' | 'EXPLOSION_RED';

export interface Particle {
  type: Material;
  vx?: number;
  vy?: number;
  resting?: boolean;
  lifetime?: number; // 폭발 효과 파티클의 수명
  fuse?: number; // 폭발물의 도화선 시간
}

export interface MaterialConfig {
  color: number;
}

export const PARTICLE_TYPE: Record<Material, MaterialConfig> = {
  SAND: { color: 0xd2b48c },
  WATER: { color: 0x3399ff },
  STONE: { color: 0x888888 },
  EXPLOSIVE: { color: 0xff0000 }, // TNT 빨간색
  EXPLOSION_WHITE: { color: 0xffffff },
  EXPLOSION_YELLOW: { color: 0xffdd00 },
  EXPLOSION_RED: { color: 0xff4444 },
};

export const MATERIALS: Material[] = ['SAND', 'WATER', 'STONE', 'EXPLOSIVE']; 