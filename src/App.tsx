import React, { useState } from "react";
import { CanvasStage } from "./components/CanvasStage";
import { Material, PARTICLE_TYPE, MATERIALS } from "./types/particle";
import { hexColor } from "./utils/common";

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
      <div style={{ 
        position: "absolute", 
        top: 24, 
        left: 24, 
        display: "flex", 
        gap: 12, 
        zIndex: 10 
      }}>
        {MATERIALS.map((material) => (
          <button
            key={material}
            onClick={() => setCurrentMaterial(material)}
            style={{
              width: 32,
              height: 32,
              border: `3px solid ${currentMaterial === material ? 'red' : 'white'}`,
              borderRadius: 0,
              background: hexColor(PARTICLE_TYPE[material].color),
              cursor: "pointer",
              padding: 0,
              transition: "border 0.2s"
            }}
            title={material}
          />
        ))}
      </div>
      
      {/* 중앙에 캔버스 */}
      <CanvasStage currentMaterial={currentMaterial} />
    </div>
  );
}

export default App; 