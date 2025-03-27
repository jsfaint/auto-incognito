import { describe, test, expect, beforeEach, vi, beforeAll, afterAll, mock } from 'bun:test';
import { resetMocks } from './mocks/chrome-api.js';

// 获取mock的chrome对象
const mockChrome = global.chrome;

// 保存原始importScripts和console.log
let originalImportScripts;
let originalConsoleLog;
let privateModeListener;
let normalModeListener;

describe('Background 脚本测试', () => {
    beforeAll(() => {
        // 备份原始函数
        originalImportScripts = global.importScripts;
        originalConsoleLog = console.log;

        // 模拟importScripts函数
        global.importScripts = vi.fn();

        // 模拟console.log
        console.log = vi.fn();
    });

    afterAll(() => {
        // 恢复原始函数
        global.importScripts = originalImportScripts;
        console.log = originalConsoleLog;
    });

    beforeEach(() => {
        resetMocks();

        // 模拟BlackList.check函数
        global.BlackList = {
            check: vi.fn()
        };

        // 模拟getPrivateOption函数
        global.getPrivateOption = vi.fn();

        // 模拟getWindowState函数
        global.getWindowState = vi.fn();

        // 存储添加的侦听器
        mockChrome.webNavigation.onBeforeNavigate.addListener.mockImplementation((callback) => {
            privateModeListener = callback;
        });

        mockChrome.tabs.onUpdated.addListener.mockImplementation((callback) => {
            normalModeListener = callback;
        });

        // 加载background.js
        require('../background.js');
    });

    test('privateModeHandler应关闭标签并打开私有窗口', async () => {
        // 模拟tab对象
        const mockTab = { id: 123, incognito: false };
        mockChrome.tabs.get.mockResolvedValue(mockTab);

        // 模拟BlackList.check函数返回true
        global.BlackList.check.mockResolvedValue(true);

        // 模拟getPrivateOption返回true
        global.getPrivateOption.mockResolvedValue(true);

        // 模拟getWindowState返回'maximized'
        global.getWindowState.mockResolvedValue('maximized');

        // 模拟 windows.getAll 返回空数组（没有现有的隐私窗口）
        mockChrome.windows.getAll.mockResolvedValue([]);

        // 调用privateModeHandler函数
        await privateModeListener({ tabId: 123, url: 'https://example.com' });

        // 验证行为
        expect(mockChrome.tabs.get).toHaveBeenCalledWith(123);
        expect(global.BlackList.check).toHaveBeenCalledWith('https://example.com');
        expect(mockChrome.tabs.remove).toHaveBeenCalledWith(123);
        expect(mockChrome.windows.create).toHaveBeenCalledWith({
            url: 'https://example.com',
            incognito: true,
            state: 'maximized'
        });
    });

    test('privateModeHandler如果tab是隐私模式应该跳过', async () => {
        // 模拟tab对象是隐私模式
        const mockTab = { id: 123, incognito: true };
        mockChrome.tabs.get.mockResolvedValue(mockTab);

        // 调用privateModeHandler函数
        await privateModeListener({ tabId: 123, url: 'https://example.com' });

        // 验证行为 - 不应该检查黑名单或创建新窗口
        expect(global.BlackList.check).not.toHaveBeenCalled();
        expect(mockChrome.windows.create).not.toHaveBeenCalled();
    });

    test('privateModeHandler如果私有选项禁用应该跳过', async () => {
        // 模拟tab对象
        const mockTab = { id: 123, incognito: false };
        mockChrome.tabs.get.mockResolvedValue(mockTab);

        // 模拟getPrivateOption返回false
        global.getPrivateOption.mockResolvedValue(false);

        // 调用privateModeHandler函数
        await privateModeListener({ tabId: 123, url: 'https://example.com' });

        // 验证行为 - 不应该检查黑名单或创建新窗口
        expect(global.BlackList.check).not.toHaveBeenCalled();
        expect(mockChrome.windows.create).not.toHaveBeenCalled();
    });

    test('privateModeHandler如果URL不在黑名单中应该跳过', async () => {
        // 模拟tab对象
        const mockTab = { id: 123, incognito: false };
        mockChrome.tabs.get.mockResolvedValue(mockTab);

        // 模拟getPrivateOption返回true
        global.getPrivateOption.mockResolvedValue(true);

        // 模拟BlackList.check返回false
        global.BlackList.check.mockResolvedValue(false);

        // 调用privateModeHandler函数
        await privateModeListener({ tabId: 123, url: 'https://example.com' });

        // 验证行为 - 不应该创建新窗口
        expect(mockChrome.windows.create).not.toHaveBeenCalled();
    });

    test('normalModeHandler应为黑名单URL注册历史删除侦听器', async () => {
        // 模拟BlackList.check返回true
        global.BlackList.check.mockResolvedValue(true);

        // 调用normalModeHandler函数
        await normalModeListener(123, { url: 'https://example.com' }, {});

        // 验证行为
        expect(global.BlackList.check).toHaveBeenCalledWith('https://example.com');
        expect(mockChrome.tabs.onRemoved.addListener).toHaveBeenCalled();

        // 获取tabs.onRemoved的侦听器函数
        const removeListener = mockChrome.tabs.onRemoved.addListener.mock.calls[0][0];

        // 模拟标签关闭
        await removeListener(123);

        // 验证历史被删除
        expect(mockChrome.history.deleteUrl).toHaveBeenCalledWith({ url: 'https://example.com' });
    });

    test('normalModeHandler如果changeInfo没有url应该跳过', async () => {
        // 调用normalModeHandler函数，没有url
        await normalModeListener(123, {}, {});

        // 验证行为 - 不应该检查黑名单
        expect(global.BlackList.check).not.toHaveBeenCalled();
    });

    test('normalModeHandler如果URL不在黑名单中应该跳过', async () => {
        // 模拟BlackList.check返回false
        global.BlackList.check.mockResolvedValue(false);

        // 调用normalModeHandler函数
        await normalModeListener(123, { url: 'https://example.com' }, {});

        // 验证行为 - 不应该注册onRemoved侦听器
        expect(mockChrome.tabs.onRemoved.addListener).not.toHaveBeenCalled();
    });
});