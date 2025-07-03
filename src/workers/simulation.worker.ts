export default {} as typeof Worker & { new (): Worker };

self.onmessage = function (e) {
  // 시뮬레이션 연산 처리
  // e.data로 명령/상태 전달받음
  // 결과는 self.postMessage로 전달
}; 