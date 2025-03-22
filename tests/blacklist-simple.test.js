// 简单测试黑名单功能

describe('BlackList Module', () => {
    let BlackList;

    beforeEach(() => {
        // 模拟 Chrome Storage API
        chrome.storage = {
            local: {
                get: jest.fn(),
                set: jest.fn()
            }
        };

        // 设置默认实现
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            callback({ blacklist: [] });
        });

        chrome.storage.local.set.mockImplementation((data, callback) => {
            if (callback) callback();
        });

        // 定义黑名单模块
        BlackList = {
            getAll: async function () {
                return new Promise((resolve) => {
                    chrome.storage.local.get(['blacklist'], function (result) {
                        resolve(result.blacklist || []);
                    });
                });
            },

            add: async function (url) {
                const blacklist = await this.getAll();
                if (blacklist.includes(url)) {
                    return false;
                }
                blacklist.push(url);
                return new Promise((resolve) => {
                    chrome.storage.local.set({ blacklist }, () => resolve(true));
                });
            },

            check: async function (url) {
                if (!url) return false;
                try {
                    const hostname = url.replace(/^https?:\/\//, '').split('/')[0];
                    if (!hostname) return false;

                    const blacklist = await this.getAll();
                    if (!Array.isArray(blacklist) || blacklist.length === 0) {
                        return false;
                    }

                    return blacklist.some(pattern => hostname.includes(pattern));
                } catch (e) {
                    return false;
                }
            }
        };
    });

    test('getAll 应该返回空数组，当黑名单为空时', async () => {
        const result = await BlackList.getAll();
        expect(result).toEqual([]);
        expect(chrome.storage.local.get).toHaveBeenCalledWith(['blacklist'], expect.any(Function));
    });

    test('getAll 应该返回黑名单数组', async () => {
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            callback({ blacklist: ['example.com', 'test.com'] });
        });

        const result = await BlackList.getAll();
        expect(result).toEqual(['example.com', 'test.com']);
    });

    test('add 应该添加URL到黑名单', async () => {
        const url = 'example.com';
        const result = await BlackList.add(url);

        expect(result).toBe(true);
        expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('check 应该检查URL是否在黑名单中', async () => {
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            callback({ blacklist: ['example.com'] });
        });

        const result1 = await BlackList.check('https://example.com/page');
        expect(result1).toBe(true);

        const result2 = await BlackList.check('https://other-site.com/page');
        expect(result2).toBe(false);
    });
});