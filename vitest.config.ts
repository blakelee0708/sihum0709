import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    // 컴포넌트 옆에 둔 순수 함수 테스트도 잡습니다 (예: WeekFlowBars.barHeight)
    include: ['lib/**/*.test.ts', 'test/**/*.test.ts', 'components/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
