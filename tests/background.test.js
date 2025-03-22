// 导入模拟的 Chrome API
// 注意: 实际执行时，background.js 需要单独测试，
// 因为它依赖于其他模块的导入，这里我们只测试其中的部分功能

const { BlackList } = require('./lib/blacklist.mock');
const { getPrivateOption } = require('./lib/private.mock');

// 因为background.mock.js依赖于BlackList和getPrivateOption，所以我们要先mock它们
// 然后才能引入background.mock.js
global.BlackList = BlackList;
global.getPrivateOption = getPrivateOption;

const { privateModeHandler, normalModeHandler, getWindowState } = require('./lib/background.mock');

describe('Background Script', () => {
    beforeEach(() => {
        // 重置所有 Chrome API 模拟
        chrome.tabs.get.mockClear();
        chrome.tabs.remove.mockClear();
        chrome.windows.create.mockClear();
        chrome.storage.sync.get.mockClear();
        chrome.tabs.onRemoved.addListener.mockClear();
        chrome.history.deleteUrl.mockClear();

        // Mock BlackList.check
        BlackList.check = jest.fn();

        // 默认模拟实现
        chrome.tabs.get.mockImplementation(() => Promise.resolve({ incognito: false }));
        chrome.tabs.remove.mockImplementation(() => Promise.resolve());
        chrome.windows.create.mockImplementation(() => Promise.resolve());

        chrome.storage.sync.get.mockImplementation((key, callback) => {
            if (callback) {
                callback({ windowState: 'maximized' });
            } else {
                return Promise.resolve({ windowState: 'maximized' });
            }
        });
    });

    describe('privateModeHandler', () => {
        test('应该在黑名单URL被访问时创建隐私窗口', async () => {
            // 设置模拟返回值
            BlackList.check.mockResolvedValue(true);

            // Mock getPrivateOption
            global.getPrivateOption = jest.fn().mockResolvedValue(true);

            // 调用处理函数
            await privateModeHandler({ tabId: 123, url: 'https://example.com' });

            // 验证行为
            expect(chrome.tabs.get).toHaveBeenCalledWith(123);
            expect(chrome.tabs.remove).toHaveBeenCalledWith(123);
            expect(chrome.windows.create).toHaveBeenCalledWith({
                url: 'https://example.com',
                incognito: true,
                state: 'maximized'
            });
        });

        test('不应该处理已经在隐私模式的标签页', async () => {
            // 设置模拟返回值
            chrome.tabs.get.mockResolvedValue({ incognito: true });

            // 调用处理函数
            await privateModeHandler({ tabId: 123, url: 'https://example.com' });

            // 验证行为
            expect(chrome.tabs.get).toHaveBeenCalledWith(123);
            expect(chrome.tabs.remove).not.toHaveBeenCalled();
            expect(chrome.windows.create).not.toHaveBeenCalled();
        });

        test('不应该处理不在黑名单中的URL', async () => {
            // 设置模拟返回值
            BlackList.check.mockResolvedValue(false);
            global.getPrivateOption = jest.fn().mockResolvedValue(true);

            // 调用处理函数
            await privateModeHandler({ tabId: 123, url: 'https://example.com' });

            // 验证行为
            expect(BlackList.check).toHaveBeenCalledWith('https://example.com');
            expect(chrome.tabs.remove).not.toHaveBeenCalled();
            expect(chrome.windows.create).not.toHaveBeenCalled();
        });

        test('不应该处理禁用了隐私选项时的URL', async () => {
            // 设置模拟返回值
            global.getPrivateOption = jest.fn().mockResolvedValue(false);

            // 调用处理函数
            await privateModeHandler({ tabId: 123, url: 'https://example.com' });

            // 验证行为
            expect(global.getPrivateOption).toHaveBeenCalled();
            expect(BlackList.check).not.toHaveBeenCalled();
            expect(chrome.tabs.remove).not.toHaveBeenCalled();
            expect(chrome.windows.create).not.toHaveBeenCalled();
        });
    });

    describe('normalModeHandler', () => {
        test('应该在黑名单URL被访问时添加历史记录删除监听器', async () => {
            // 设置模拟返回值
            BlackList.check.mockResolvedValue(true);

            // 调用处理函数
            await normalModeHandler(123, { url: 'https://example.com' }, {});

            // 验证行为
            expect(BlackList.check).toHaveBeenCalledWith('https://example.com');
            expect(chrome.tabs.onRemoved.addListener).toHaveBeenCalled();
        });

        test('不应该处理changeInfo中没有URL的情况', async () => {
            // 调用处理函数
            await normalModeHandler(123, {}, {});

            // 验证行为
            expect(BlackList.check).not.toHaveBeenCalled();
            expect(chrome.tabs.onRemoved.addListener).not.toHaveBeenCalled();
        });

        test('不应该处理不在黑名单中的URL', async () => {
            // 设置模拟返回值
            BlackList.check.mockResolvedValue(false);

            // 调用处理函数
            await normalModeHandler(123, { url: 'https://example.com' }, {});

            // 验证行为
            expect(BlackList.check).toHaveBeenCalledWith('https://example.com');
            expect(chrome.tabs.onRemoved.addListener).not.toHaveBeenCalled();
        });
    });

    describe('getWindowState', () => {
        test('应该返回保存的窗口状态', async () => {
            const state = await getWindowState();
            expect(state).toBe('maximized');
            expect(chrome.storage.sync.get).toHaveBeenCalledWith(['windowState']);
        });

        test('应该处理没有窗口状态的情况', async () => {
            // 设置模拟返回空对象
            chrome.storage.sync.get.mockImplementation((key, callback) => {
                callback({});
            });

            const state = await getWindowState();
            expect(state).toBeUndefined();
        });
    });
}); 