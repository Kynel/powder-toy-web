import React, { useState } from "react";
import { CanvasStage } from "./components/CanvasStage";
import { PARTICLE_TYPE } from "./types/particle";

const MATERIALS = Object.keys(PARTICLE_TYPE);

type Material = keyof typeof PARTICLE_TYPE;

function hexColor(num: number) {
  let hex = num.toString(16);
  while (hex.length < 6) hex = '0' + hex;
  return `#${hex}`;
}

function App() {
  const [currentMaterial, setCurrentMaterial] = useState<Material>("SAND");

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* 머티리얼 선택 UI */}
      <div style={{ position: "absolute", top: 24, left: 24, display: "flex", gap: 12, zIndex: 10 }}>
        {MATERIALS.map((mat) => (
          <div
            key={mat}
            onClick={() => setCurrentMaterial(mat as Material)}
            style={{
              width: 32,
              height: 32,
              border: `3px solid ${currentMaterial === mat ? 'red' : 'white'}`,
              borderRadius: 0,
              background: hexColor(PARTICLE_TYPE[mat as Material].color),
              cursor: "pointer",
              boxShadow: undefined,
              transition: "border 0.2s"
            }}
            title={mat}
          />
        ))}
      </div>
      {/* 중앙에 캔버스 */}
      <CanvasStage currentMaterial={currentMaterial} />
    </div>
  );
}

export default App; 