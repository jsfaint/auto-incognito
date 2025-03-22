const { BlackList } = require('./lib/blacklist.mock');

describe('BlackList', () => {
    beforeEach(() => {
        // 重置 chrome.storage.local 模拟
        chrome.storage.local.get.mockClear();
        chrome.storage.local.set.mockClear();

        // 设置默认返回空数组
        chrome.storage.local.get.mockImplementation((key, callback) => {
            callback({ blacklist: [] });
        });

        chrome.storage.local.set.mockImplementation((data, callback) => {
            if (callback) callback();
        });
    });

    describe('getAll', () => {
        test('应该返回空数组，当没有黑名单项时', async () => {
            const result = await BlackList.getAll();
            expect(result).toEqual([]);
            expect(chrome.storage.local.get).toHaveBeenCalledWith(['blacklist'], expect.any(Function));
        });

        test('应该返回黑名单数组', async () => {
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback({ blacklist: ['example.com', 'test.com'] });
            });

            const result = await BlackList.getAll();
            expect(result).toEqual(['example.com', 'test.com']);
        });
    });

    describe('add', () => {
        test('应该添加新的URL到黑名单', async () => {
            const url = 'example.com';
            const result = await BlackList.add(url);

            expect(result).toBe(true);
            expect(chrome.storage.local.set).toHaveBeenCalledWith(
                { blacklist: [url] },
                expect.any(Function)
            );
        });

        test('不应该添加已存在的URL', async () => {
            const url = 'example.com';

            // 模拟黑名单中已有该URL
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback({ blacklist: [url] });
            });

            const result = await BlackList.add(url);

            expect(result).toBe(false);
            expect(chrome.storage.local.set).not.toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        test('应该从黑名单中移除URL', async () => {
            const url = 'example.com';

            // 模拟黑名单中有该URL
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback({ blacklist: [url, 'test.com'] });
            });

            const result = await BlackList.remove(url);

            expect(result).toBe(true);
            expect(chrome.storage.local.set).toHaveBeenCalledWith(
                { blacklist: ['test.com'] },
                expect.any(Function)
            );
        });

        test('不应该移除不存在的URL', async () => {
            const url = 'example.com';

            // 模拟黑名单中没有该URL
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback({ blacklist: ['test.com'] });
            });

            const result = await BlackList.remove(url);

            expect(result).toBe(false);
            expect(chrome.storage.local.set).not.toHaveBeenCalled();
        });
    });

    describe('check', () => {
        test('应该返回true，当URL在黑名单中', async () => {
            // 模拟黑名单
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback({ blacklist: ['example.com'] });
            });

            const result = await BlackList.check('https://example.com/page');

            expect(result).toBe(true);
        });

        test('应该返回false，当URL不在黑名单中', async () => {
            // 模拟黑名单
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback({ blacklist: ['test.com'] });
            });

            const result = await BlackList.check('https://example.com/page');

            expect(result).toBe(false);
        });

        test('应该返回false，当URL无效时', async () => {
            const result = await BlackList.check('invalid-url');
            expect(result).toBe(false);
        });
    });

    describe('removeBatch', () => {
        test('应该批量删除多个URL', async () => {
            // 模拟黑名单
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback({ blacklist: ['site1.com', 'site2.com', 'site3.com'] });
            });

            const result = await BlackList.removeBatch(['site1.com', 'site3.com']);

            expect(result).toBe(2);
            expect(chrome.storage.local.set).toHaveBeenCalledWith(
                { blacklist: ['site2.com'] },
                expect.any(Function)
            );
        });

        test('应该返回0，当没有URL被删除时', async () => {
            // 模拟黑名单
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback({ blacklist: ['site1.com', 'site2.com'] });
            });

            const result = await BlackList.removeBatch(['site3.com']);

            expect(result).toBe(0);
            expect(chrome.storage.local.set).not.toHaveBeenCalled();
        });
    });
});