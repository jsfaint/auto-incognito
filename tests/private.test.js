const { getPrivateOption, setPrivateOption } = require('./lib/private.mock');

describe('Private Mode Functions', () => {
    beforeEach(() => {
        // 重置所有模拟
        chrome.storage.sync.get.mockClear();
        chrome.storage.sync.set.mockClear();

        // 设置默认返回值
        chrome.storage.sync.get.mockImplementation((key, callback) => {
            if (callback) {
                callback({});
            } else {
                return Promise.resolve({});
            }
        });

        chrome.storage.sync.set.mockImplementation((data, callback) => {
            if (callback) callback();
            return Promise.resolve();
        });
    });

    describe('getPrivateOption', () => {
        test('应该返回undefined，当没有设置隐私选项时', async () => {
            const result = await getPrivateOption();
            expect(result).toBeUndefined();
            expect(chrome.storage.sync.get).toHaveBeenCalledWith(['private']);
        });

        test('应该返回true，当隐私选项设置为true时', async () => {
            // 模拟返回true
            chrome.storage.sync.get.mockImplementation((key, callback) => {
                callback({ private: true });
            });

            const result = await getPrivateOption();
            expect(result).toBe(true);
        });

        test('应该返回false，当隐私选项设置为false时', async () => {
            // 模拟返回false
            chrome.storage.sync.get.mockImplementation((key, callback) => {
                callback({ private: false });
            });

            const result = await getPrivateOption();
            expect(result).toBe(false);
        });
    });

    describe('setPrivateOption', () => {
        test('应该设置隐私选项为true', async () => {
            await setPrivateOption(true);
            expect(chrome.storage.sync.set).toHaveBeenCalledWith({ private: true });
        });

        test('应该设置隐私选项为false', async () => {
            await setPrivateOption(false);
            expect(chrome.storage.sync.set).toHaveBeenCalledWith({ private: false });
        });
    });
}); 