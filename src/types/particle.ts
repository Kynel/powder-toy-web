export type Material = 'SAND' | 'WATER' | 'STONE' | 'WOOD' | 'EXPLOSIVE' | 'FIRE' | 'SMOKE' | 'EXPLOSION_WHITE' | 'EXPLOSION_YELLOW' | 'EXPLOSION_RED';

export interface Particle {
  type: Material;
  vx?: number;
  vy?: number;
  resting?: boolean;
  lifetime?: number; // 폭발 효과 파티클의 수명
  fuse?: number; // 폭발물의 도화선 시간
  fireExposure?: number; // 나무가 불에 노출된 시간
  burning?: boolean; // 나무가 연소 중인지 여부
  burnTime?: number; // 연소 지속 시간
}

export interface MaterialConfig {
  color: number;
}

export const PARTICLE_TYPE: Record<Material, MaterialConfig> = {
  SAND: { color: 0xd2b48c },
  WATER: { color: 0x3399ff },
  STONE: { color: 0x888888 },
  WOOD: { color: 0x8B4513 }, // 나무 갈색
  EXPLOSIVE: { color: 0x8B4513 }, // TNT 갈색
  FIRE: { color: 0xff4500 }, // 화염 오렌지-빨강
  SMOKE: { color: 0x696969 }, // 연기 회색
  EXPLOSION_WHITE: { color: 0xffffff },
  EXPLOSION_YELLOW: { color: 0xffdd00 },
  EXPLOSION_RED: { color: 0xff4444 },
};

export const MATERIALS: Material[] = ['SAND', 'WATER' , 'STONE', 'WOOD', 'FIRE', 'EXPLOSIVE']; 