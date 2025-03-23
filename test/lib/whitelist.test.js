import { describe, test, expect, beforeEach, vi, mock } from 'bun:test';

// 导入被测试的模块
let findInWhitelist;

describe('Whitelist 模块', () => {
    // 在每个测试前重置模拟和重新导入模块
    beforeEach(() => {
        // 重新导入模块
        const whitelistModule = require('../../lib/whitelist.js');
        findInWhitelist = whitelistModule.findInWhitelist;
    });

    test('findInWhitelist应检测出白名单中的URL', () => {
        // 测试白名单中的URL
        expect(findInWhitelist('about:blank')).toBe(true);
        expect(findInWhitelist('chrome://settings')).toBe(true);
        expect(findInWhitelist('edge://settings')).toBe(true);
    });

    test('findInWhitelist应返回false对于不在白名单中的URL', () => {
        // 测试不在白名单中的URL
        expect(findInWhitelist('https://example.com')).toBe(false);
        expect(findInWhitelist('http://test.com')).toBe(false);
        expect(findInWhitelist('file:///C:/test.html')).toBe(false);
    });
}); 