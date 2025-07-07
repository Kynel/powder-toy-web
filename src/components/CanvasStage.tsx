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
          
          // 폭발물은 10프레임마다, 다른 파티클은 2프레임마다 생성
          const spawnInterval = currentMaterial === 'EXPLOSIVE' ? 10 : 2;
          
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
                  // TNT 패턴 렌더링 (빨간색과 검은색 체크패턴)
                  const isRedPattern = (x + y) % 2 === 0;
                  const tntColor = isRedPattern ? 0xff0000 : 0x000000;
                  graphics.beginFill(tntColor);
                  graphics.drawRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
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