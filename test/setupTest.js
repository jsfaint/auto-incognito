import { beforeEach, vi } from 'bun:test';
import { resetMocks } from './mocks/chrome-api.js';

// 模拟 importScripts
global.importScripts = vi.fn();

// 在每个测试前重置所有模拟
beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
});

console.log('Bun测试环境已初始化');