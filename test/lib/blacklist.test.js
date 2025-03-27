import { describe, test, expect, beforeEach, vi, mock } from 'bun:test';
import { resetMocks } from '../mocks/chrome-api.js';

// 导入被测试的模块
const mockChrome = global.chrome;

// 手动导入BlackList对象
let BlackList;

describe('BlackList 模块', () => {
    // 在每个测试前重置模拟
    beforeEach(() => {
        resetMocks();

        // 重新导入模块
        const blacklistModule = require('../../lib/blacklist.js');
        BlackList = blacklistModule.BlackList || blacklistModule.default || blacklistModule;
    });

    test('getAll方法应返回空数组当存储中没有blacklist', async () => {
        // 模拟chrome.storage.sync.get返回空对象
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({});
            return Promise.resolve({});
        });

        const result = await BlackList.getAll();
        expect(result).toEqual([]);
        expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['blacklist'], expect.any(Function));
    });

    test('getAll方法应返回存储中的blacklist数组', async () => {
        const mockBlacklist = ['example.com', 'test.com'];

        // 模拟chrome.storage.sync.get返回包含blacklist的对象
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ blacklist: mockBlacklist });
            return Promise.resolve({ blacklist: mockBlacklist });
        });

        const result = await BlackList.getAll();
        expect(result).toEqual(mockBlacklist);
        expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['blacklist'], expect.any(Function));
    });

    test('add方法应添加新URL到blacklist', async () => {
        const existingBlacklist = ['example.com'];
        const newUrl = 'test.com';
        const expectedBlacklist = [...existingBlacklist, newUrl];

        // 模拟初始获取blacklist
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ blacklist: existingBlacklist });
            return Promise.resolve({ blacklist: existingBlacklist });
        });

        // 模拟存储更新后的blacklist
        mockChrome.storage.sync.set.mockImplementation((data, callback) => {
            callback();
            return Promise.resolve();
        });

        const result = await BlackList.add(newUrl);
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
            { blacklist: expectedBlacklist },
            expect.any(Function)
        );
    });

    test('add方法如果URL已存在应返回false', async () => {
        const existingUrl = 'example.com';
        const existingBlacklist = [existingUrl];

        // 模拟初始获取blacklist
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ blacklist: existingBlacklist });
            return Promise.resolve({ blacklist: existingBlacklist });
        });

        const result = await BlackList.add(existingUrl);
        expect(result).toBe(false);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('remove方法应从blacklist中移除指定URL', async () => {
        const url1 = 'example.com';
        const url2 = 'test.com';
        const existingBlacklist = [url1, url2];
        const expectedBlacklist = [url2];

        // 模拟初始获取blacklist
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ blacklist: existingBlacklist });
            return Promise.resolve({ blacklist: existingBlacklist });
        });

        // 模拟存储更新后的blacklist
        mockChrome.storage.sync.set.mockImplementation((data, callback) => {
            callback();
            return Promise.resolve();
        });

        const result = await BlackList.remove(url1);
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
            { blacklist: expectedBlacklist },
            expect.any(Function)
        );
    });

    test('remove方法如果URL不存在应返回false', async () => {
        const existingBlacklist = ['example.com'];
        const nonExistingUrl = 'nonexisting.com';

        // 模拟初始获取blacklist
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ blacklist: existingBlacklist });
            return Promise.resolve({ blacklist: existingBlacklist });
        });

        const result = await BlackList.remove(nonExistingUrl);
        expect(result).toBe(false);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('check方法应正确检测URL是否在黑名单中', async () => {
        const blacklist = ['example.com', 'test.com'];

        // 模拟获取blacklist
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ blacklist });
            return Promise.resolve({ blacklist });
        });

        // 匹配的URL
        let result = await BlackList.check('https://example.com/path');
        expect(result).toBe(true);

        // 子域名应该也能匹配
        result = await BlackList.check('https://sub.example.com/path');
        expect(result).toBe(true);

        // 不匹配的URL
        result = await BlackList.check('https://other.com/path');
        expect(result).toBe(false);
    });

    test('check方法对无效URL应返回false', async () => {
        // 无效URL
        const result = await BlackList.check('invalid-url');
        expect(result).toBe(false);
    });

    test('set方法应正确设置blacklist', async () => {
        const newBlacklist = ['domain1.com', 'domain2.com'];

        // 模拟存储更新
        mockChrome.storage.sync.set.mockImplementation((data, callback) => {
            callback();
            return Promise.resolve();
        });

        const result = await BlackList.set(newBlacklist);
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
            { blacklist: newBlacklist },
            expect.any(Function)
        );
    });

    test('removeBatch方法应批量移除多个URL', async () => {
        const urls = ['example.com', 'test.com', 'sample.com'];
        const remainingUrl = 'remaining.com';
        const existingBlacklist = [...urls, remainingUrl];
        const expectedBlacklist = [remainingUrl];

        // 模拟初始获取blacklist
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ blacklist: existingBlacklist });
            return Promise.resolve({ blacklist: existingBlacklist });
        });

        // 模拟存储更新后的blacklist
        mockChrome.storage.sync.set.mockImplementation((data, callback) => {
            callback();
            return Promise.resolve();
        });

        const result = await BlackList.removeBatch(urls);
        expect(result).toBe(3); // 应返回移除的数量
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
            { blacklist: expectedBlacklist },
            expect.any(Function)
        );
    });

    test('removeBatch方法对空数组或无效输入应返回0', async () => {
        const existingBlacklist = ['example.com', 'test.com'];

        // 模拟初始获取blacklist
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ blacklist: existingBlacklist });
            return Promise.resolve({ blacklist: existingBlacklist });
        });

        // 测试空数组
        let result = await BlackList.removeBatch([]);
        expect(result).toBe(0);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();

        // 测试null
        result = await BlackList.removeBatch(null);
        expect(result).toBe(0);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();

        // 测试undefined
        result = await BlackList.removeBatch(undefined);
        expect(result).toBe(0);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('removeBatch方法对不存在的URL应正确处理', async () => {
        const existingBlacklist = ['example.com', 'test.com'];
        const nonExistingUrls = ['nonexisting1.com', 'nonexisting2.com'];

        // 模拟初始获取blacklist
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ blacklist: existingBlacklist });
            return Promise.resolve({ blacklist: existingBlacklist });
        });

        const result = await BlackList.removeBatch(nonExistingUrls);
        expect(result).toBe(0); // 没有任何URL被删除
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('removeBatch方法对部分存在的URL应正确处理', async () => {
        const existingUrl = 'example.com';
        const nonExistingUrl = 'nonexisting.com';
        const existingBlacklist = [existingUrl, 'test.com'];
        const expectedBlacklist = ['test.com'];

        // 模拟初始获取blacklist
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ blacklist: existingBlacklist });
            return Promise.resolve({ blacklist: existingBlacklist });
        });

        // 模拟存储更新后的blacklist
        mockChrome.storage.sync.set.mockImplementation((data, callback) => {
            callback();
            return Promise.resolve();
        });

        const result = await BlackList.removeBatch([existingUrl, nonExistingUrl]);
        expect(result).toBe(1); // 只有一个URL被删除
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
            { blacklist: expectedBlacklist },
            expect.any(Function)
        );
    });
});