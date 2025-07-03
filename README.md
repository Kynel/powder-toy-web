# Powder Toy Web

React + TypeScript + PixiJS + Web Worker 기반 샌드박스 시뮬레이터

## 주요 기술 스택
- React
- TypeScript
- PixiJS (WebGL 기반 2D 렌더링)
- Web Worker (시뮬레이션 연산 분리)
- Vite (개발 환경)

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

---

입자 시뮬레이션 로직은 src/workers/simulation.worker.ts에 구현하면 됩니다.
PixiJS 기반 캔버스는 src/components/CanvasStage.tsx에서 관리합니다. 