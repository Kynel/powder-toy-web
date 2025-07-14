import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Particle, Material, PARTICLE_TYPE } from "../types/particle";
import { CELL_SIZE, GRID_WIDTH, GRID_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from "../config/constants";
import { stepSimulation } from "../simulation/step";

interface CanvasStageProps {
  currentMaterial: Material;
  onExplosion?: (x: number, y: number) => void;
}

interface MouseState {
  isMouseDown: boolean;
  mouseX: number;
  mouseY: number;
  spawnCounter: number;
}

function createEmptyGrid(): (Particle | null)[][] {
  return Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));
}

function explodeParticles(grid: (Particle | null)[][], cx: number, cy: number, radius = 10, force = 5): void {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const dx = cx + x;
      const dy = cy + y;
      const dist = Math.sqrt(x * x + y * y);
      
      if (dx >= 0 && dx < GRID_WIDTH && dy >= 0 && dy < GRID_HEIGHT && dist <= radius) {
        const particle = grid[dy][dx];
        if (particle) {
          const angle = Math.atan2(y, x);
          const magnitude = (1 - dist / radius) * force;
          particle.vx = Math.cos(angle) * magnitude;
          particle.vy = Math.sin(angle) * magnitude;
          particle.resting = false;
        }
      }
    }
  }
}

export const CanvasStage: React.FC<CanvasStageProps> = ({ currentMaterial, onExplosion }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [grid, setGrid] = useState<(Particle | null)[][]>(createEmptyGrid);
  const gridRef = useRef(grid);
  const mouseState = useRef<MouseState>({ isMouseDown: false, mouseX: 0, mouseY: 0, spawnCounter: 0 });

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    let destroyed = false;
    
    (async () => {
      const app = new PIXI.Application();
      await app.init({ 
        width: CANVAS_WIDTH, 
        height: CANVAS_HEIGHT, 
        backgroundColor: 0x222222 
      });
      
      if (destroyed) {
        app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true });
        return;
      }
      
      appRef.current = app;
      
      if (canvasRef.current) {
        canvasRef.current.appendChild(app.canvas as HTMLCanvasElement);
        const canvas = app.canvas as HTMLCanvasElement;
        canvas.style.border = '4px solid #fff';
        canvas.style.borderRadius = '0';
        canvas.style.display = 'block';
      }
      
      const graphics = new PIXI.Graphics();
      app.stage.addChild(graphics);

      const canvas = app.canvas as HTMLCanvasElement;
      
      function trySpawnParticle(x: number, y: number): void {
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return;
        
        setGrid(prevGrid => {
          if (currentMaterial === 'STONE') {
            return prevGrid.map((row, j) =>
              row.map((cell, i) => {
                if (
                  i >= x && i < x + 2 &&
                  j >= y && j < y + 2 &&
                  i < GRID_WIDTH &&
                  j < GRID_HEIGHT
                ) {
                  return { type: 'STONE' };
                }
                return cell;
              })
            );
          } else if (currentMaterial === 'WOOD') {
            // 나무는 6x6 크기로 생성
            return prevGrid.map((row, j) =>
              row.map((cell, i) => {
                if (
                  i >= x - 2 && i <= x + 3 &&
                  j >= y - 2 && j <= y + 3 &&
                  i >= 0 && i < GRID_WIDTH &&
                  j >= 0 && j < GRID_HEIGHT
                ) {
                  return { type: 'WOOD' };
                }
                return cell;
              })
            );
          } else if (!prevGrid[y][x]) {
            return prevGrid.map((row, j) =>
              row.map((cell, i) => (i === x && j === y ? { type: currentMaterial } : cell))
            );
          }
          return prevGrid;
        });
      }

      // 입력 이벤트 설정
      canvas.addEventListener("pointerdown", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
        mouseState.current.mouseX = x;
        mouseState.current.mouseY = y;
        mouseState.current.isMouseDown = true;
        mouseState.current.spawnCounter = 0;
        trySpawnParticle(x, y);
      });

      canvas.addEventListener("pointerup", () => {
        mouseState.current.isMouseDown = false;
        mouseState.current.spawnCounter = 0;
      });

      canvas.addEventListener("pointerleave", () => {
        mouseState.current.isMouseDown = false;
        mouseState.current.spawnCounter = 0;
      });

      canvas.addEventListener("pointermove", (e) => {
        if (!mouseState.current.isMouseDown) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
        mouseState.current.mouseX = x;
        mouseState.current.mouseY = y;
        trySpawnParticle(x, y);
      });

      canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
        explodeParticles(gridRef.current, x, y, 12, 5);
        onExplosion?.(x, y);
      });

      // 시뮬레이션 및 렌더링 루프
      app.ticker.add(() => {
        // 마우스가 눌려진 상태면 일정 간격으로 파티클 생성
        if (mouseState.current.isMouseDown) {
          mouseState.current.spawnCounter++;
          
          // 파티클별 생성 간격 설정
          let spawnInterval = 2; // 기본값
          if (currentMaterial === 'EXPLOSIVE') {
            spawnInterval = 10; // 폭발물은 가장 느리게
          } else if (currentMaterial === 'WOOD') {
            spawnInterval = 12; // 나무는 더 느리게 (6x6 크기이므로)
          } else if (currentMaterial === 'STONE') {
            spawnInterval = 4; // 돌은 약간 느리게 (2x2 크기이므로)
          }
          
          if (mouseState.current.spawnCounter >= spawnInterval) {
            trySpawnParticle(mouseState.current.mouseX, mouseState.current.mouseY);
            mouseState.current.spawnCounter = 0;
          }
        }

        setGrid((prevGrid) => {
          const updatedGrid = stepSimulation(prevGrid);
          
          // 렌더링
          graphics.clear();
          for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
              const particle = updatedGrid[y][x];
              if (particle) {
                if (particle.type === 'EXPLOSIVE') {
                  // TNT 렌더링 - 갈색 바탕에 빨간 라벨
                  const baseColor = 0x8B4513; // 갈색 바탕
                  const labelColor = 0xff0000; // 빨간 라벨
                  
                  // 갈색 바탕
                  graphics.beginFill(baseColor);
                  graphics.drawRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                  graphics.endFill();
                  
                  // 빨간 라벨 (중앙에 작은 사각형)
                  const labelSize = CELL_SIZE * 0.6;
                  const labelOffset = (CELL_SIZE - labelSize) / 2;
                  graphics.beginFill(labelColor);
                  graphics.drawRect(
                    x * CELL_SIZE + labelOffset, 
                    y * CELL_SIZE + labelOffset, 
                    labelSize, 
                    labelSize
                  );
                  graphics.endFill();
                  
                  // 도화선이 거의 다 타면 깜빡이는 효과
                  if (particle.fuse !== undefined && particle.fuse < 60) {
                    const shouldBlink = Math.floor(particle.fuse / 5) % 2 === 0;
                    if (shouldBlink) {
                      graphics.beginFill(0xffffff);
                      graphics.drawRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                      graphics.endFill();
                    }
                  }
                } else if (particle.type === 'FIRE') {
                  // 화염 렌더링 - 깜빡이는 효과와 색상 변화
                  const fireColors = [0xff4500, 0xff6600, 0xff8800, 0xffaa00]; // 오렌지~노랑 그라데이션
                  const randomColor = fireColors[Math.floor(Math.random() * fireColors.length)];
                  
                  // 수명에 따른 투명도 효과
                  const alpha = particle.lifetime ? Math.min(1, particle.lifetime / 60) : 1;
                  
                  graphics.beginFill(randomColor);
                  graphics.drawRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                  graphics.endFill();
                  
                  // 깜빡이는 효과 (10% 확률로 더 밝게)
                  if (Math.random() < 0.1) {
                    graphics.beginFill(0xffff00); // 밝은 노란색
                    graphics.drawRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    graphics.endFill();
                  }
                } else if (particle.type === 'WOOD') {
                  // 나무 렌더링 - 나이테와 질감 표현
                  const woodColors = [0x8B4513, 0xA0522D, 0x654321, 0x795548]; // 다양한 갈색 톤
                  
                  // 연소 중인 나무는 다른 색상으로
                  if (particle.burning) {
                    // 연소 중인 나무 - 밝은 오렌지/노란색 계열 (실제 나무가 타는 색상)
                    const burnColors = [0xff8c00, 0xff6600, 0xffa500, 0xffb347]; // 밝은 오렌지 계열
                    const burnPattern = (x + y + Math.floor(Date.now() / 100)) % 4; // 깜빡이는 효과
                    const burnColor = burnColors[burnPattern];
                    
                    graphics.beginFill(burnColor);
                    graphics.drawRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    graphics.endFill();
                    
                    // 매우 뜨거운 중심부 (밝은 노란색-흰색)
                    if (Math.random() < 0.4) {
                      const hotColors = [0xffff00, 0xffff66, 0xffffcc]; // 노란색~흰색
                      const hotColor = hotColors[Math.floor(Math.random() * hotColors.length)];
                      graphics.beginFill(hotColor);
                      const hotSize = CELL_SIZE * (0.2 + Math.random() * 0.4);
                      const hotX = x * CELL_SIZE + (CELL_SIZE - hotSize) / 2 + (Math.random() - 0.5) * 4;
                      const hotY = y * CELL_SIZE + (CELL_SIZE - hotSize) / 2 + (Math.random() - 0.5) * 4;
                      graphics.drawRect(hotX, hotY, hotSize, hotSize);
                      graphics.endFill();
                    }
                    
                    // 가장자리 화염 효과 (빨간색)
                    if (Math.random() < 0.3) {
                      graphics.beginFill(0xff4444);
                      const edgeSize = CELL_SIZE * 0.2;
                      const edgeX = x * CELL_SIZE + Math.random() * (CELL_SIZE - edgeSize);
                      const edgeY = y * CELL_SIZE + Math.random() * (CELL_SIZE - edgeSize);
                      graphics.drawRect(edgeX, edgeY, edgeSize, edgeSize);
                      graphics.endFill();
                    }
                  } else {
                    // 일반 나무 렌더링
                    // 위치에 따른 나이테 패턴
                    const ringPattern = (x + y) % 4;
                    const baseColor = woodColors[ringPattern];
                    
                    // 불에 노출된 정도에 따른 색상 변화
                    let displayColor = baseColor;
                    if (particle.fireExposure && particle.fireExposure > 30) {
                      // 불에 노출되면 점점 어두워짐
                      const darkening = Math.min(particle.fireExposure / 60, 0.5);
                      const r = ((baseColor >> 16) & 0xFF) * (1 - darkening);
                      const g = ((baseColor >> 8) & 0xFF) * (1 - darkening);
                      const b = (baseColor & 0xFF) * (1 - darkening);
                      displayColor = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
                    }
                    
                    // 기본 나무 색상
                    graphics.beginFill(displayColor);
                    graphics.drawRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    graphics.endFill();
                    
                    // 나이테 라인 (세로 줄무늬로 나무 질감 표현)
                    if (x % 2 === 0) {
                      graphics.beginFill(0x654321); // 더 어두운 갈색 줄무늬
                      graphics.drawRect(
                        x * CELL_SIZE + CELL_SIZE * 0.3, 
                        y * CELL_SIZE, 
                        CELL_SIZE * 0.4, 
                        CELL_SIZE
                      );
                      graphics.endFill();
                    }
                    
                    // 옹이 표현 (랜덤하게 작은 원형 점)
                    if ((x + y * 3) % 7 === 0) {
                      graphics.beginFill(0x3E2723); // 매우 어두운 갈색
                      const knotSize = CELL_SIZE * 0.3;
                      const knotX = x * CELL_SIZE + (CELL_SIZE - knotSize) / 2;
                      const knotY = y * CELL_SIZE + (CELL_SIZE - knotSize) / 2;
                      graphics.drawCircle(knotX + knotSize/2, knotY + knotSize/2, knotSize/2);
                      graphics.endFill();
                    }
                  }
                } else if (particle.type === 'SMOKE') {
                  // 연기 렌더링 - 반투명하고 자연스러운 회색
                  const smokeColors = [0x696969, 0x808080, 0x555555, 0x999999]; // 다양한 회색 톤
                  const smokePattern = (x + y + Math.floor(Date.now() / 200)) % 4; // 천천히 변화
                  const smokeColor = smokeColors[smokePattern];
                  
                  graphics.beginFill(smokeColor);
                  graphics.drawRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                  graphics.endFill();
                  
                  // 약간의 투명도 효과를 위한 더 밝은 중심부
                  if (Math.random() < 0.4) {
                    graphics.beginFill(0xcccccc);
                    const centerSize = CELL_SIZE * 0.4;
                    const centerX = x * CELL_SIZE + (CELL_SIZE - centerSize) / 2;
                    const centerY = y * CELL_SIZE + (CELL_SIZE - centerSize) / 2;
                    graphics.drawRect(centerX, centerY, centerSize, centerSize);
                    graphics.endFill();
                  }
                } else {
                  const color = PARTICLE_TYPE[particle.type].color;
                  graphics.beginFill(color);
                  graphics.drawRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                  graphics.endFill();
                }
              }
            }
          }
          
          return updatedGrid;
        });
      });
    })();

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy({ removeView: true }, { children: true, texture: true, textureSource: true });
        appRef.current = null;
      }
      if (canvasRef.current) {
        canvasRef.current.innerHTML = '';
      }
    };
  }, [currentMaterial, onExplosion]);

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        maxWidth: CANVAS_WIDTH,
        maxHeight: CANVAS_HEIGHT,
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        margin: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'transparent',
        touchAction: 'none',
      }}
    />
  );
}; 