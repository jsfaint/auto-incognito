import { beforeEach, vi } from 'bun:test';
import { resetMocks } from './mocks/chrome-api.js';

// Stub importScripts
global.importScripts = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
});

console.log('Bun测试环境已初始化');