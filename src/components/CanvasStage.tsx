import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Particle, Material, PARTICLE_TYPE, CELL_SIZE, GRID_WIDTH, GRID_HEIGHT, WIDTH, HEIGHT } from "../types/particle";
import { stepSimulation } from "../simulation/step";

const GRAVITY = 0.2;
const TERMINAL_VELOCITY = 3;

interface CanvasStageProps {
  currentMaterial: Material;
  onExplosion?: (x: number, y: number) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({ currentMaterial, onExplosion }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [grid, setGrid] = useState<(Particle | null)[][]>(
    () => Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null))
  );
  const gridRef = useRef(grid);
  const mouseState = useRef({ isMouseDown: false, mouseX: 0, mouseY: 0 });

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    let destroyed = false;
    (async () => {
      const app = new PIXI.Application();
      await app.init({ width: WIDTH, height: HEIGHT, backgroundColor: 0x222222 });
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

      // 입력 이벤트
      const canvas = app.canvas as HTMLCanvasElement;
      canvas.addEventListener("pointerdown", (e) => {
        mouseState.current.isMouseDown = true;
      });
      canvas.addEventListener("pointerup", () => {
        mouseState.current.isMouseDown = false;
      });
      canvas.addEventListener("pointerleave", () => {
        mouseState.current.isMouseDown = false;
      });
      canvas.addEventListener("pointermove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseState.current.mouseX = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        mouseState.current.mouseY = Math.floor((e.clientY - rect.top) / CELL_SIZE);
      });
      canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
        explode(x, y, 12, 5);
        if (onExplosion) onExplosion(x, y);
      });

      function explode(cx: number, cy: number, radius = 10, force = 5) {
        const grid = gridRef.current;
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

      function shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      // 시뮬레이션 및 렌더링 루프
      app.ticker.add(() => {
        setGrid((prevGrid) => {
          let nextGrid = prevGrid;
          // 마우스 입력 처리
          if (mouseState.current.isMouseDown) {
            const x = mouseState.current.mouseX;
            const y = mouseState.current.mouseY;
            if (
              x >= 0 && x < GRID_WIDTH &&
              y >= 0 && y < GRID_HEIGHT
            ) {
              if (currentMaterial === 'STONE') {
                // 2x2 크기로 STONE 생성
                nextGrid = prevGrid.map((row, j) =>
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
                // 기존 입자가 없을 때만 새 입자 생성
                nextGrid = prevGrid.map((row, j) =>
                  row.map((cell, i) => (i === x && j === y ? { type: currentMaterial } : cell))
                );
              }
            }
          }
          // 시뮬레이션
          const updated = stepSimulation(nextGrid);
          // 렌더링
          graphics.clear();
          for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
              const p = updated[y][x];
              if (p) {
                const color = PARTICLE_TYPE[p.type].color;
                graphics.fill({ color });
                graphics.rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
              }
            }
          }
          return updated;
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
        maxWidth: WIDTH,
        maxHeight: HEIGHT,
        aspectRatio: `${WIDTH} / ${HEIGHT}`,
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