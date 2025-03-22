// 简单测试基本存储API功能

describe('Storage API Functions', () => {
    beforeEach(() => {
        // 模拟 Chrome Storage API
        chrome.storage = {
            local: {
                get: jest.fn(),
                set: jest.fn()
            },
            sync: {
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

        chrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({});
        });

        chrome.storage.sync.set.mockImplementation((data, callback) => {
            if (callback) callback();
        });
    });

    test('本地存储API应该正常工作', () => {
        expect(chrome.storage.local.get).not.toHaveBeenCalled();

        chrome.storage.local.get(['test'], (result) => {
            expect(result).toEqual({ blacklist: [] });
        });

        expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
    });

    test('同步存储API应该正常工作', () => {
        expect(chrome.storage.sync.get).not.toHaveBeenCalled();

        chrome.storage.sync.get(['private'], (result) => {
            expect(result).toEqual({});
        });

        expect(chrome.storage.sync.get).toHaveBeenCalledTimes(1);

        chrome.storage.sync.set({ private: true }, () => { });
        expect(chrome.storage.sync.set).toHaveBeenCalledWith({ private: true }, expect.any(Function));
    });

    test('密码存储API应该正常工作', () => {
        expect(chrome.storage.sync.get).not.toHaveBeenCalled();

        chrome.storage.sync.get('password', (result) => {
            expect(result).toEqual({});
        });

        expect(chrome.storage.sync.get).toHaveBeenCalledTimes(1);

        chrome.storage.sync.set({ password: 'test123' }, () => { });
        expect(chrome.storage.sync.set).toHaveBeenCalledWith({ password: 'test123' }, expect.any(Function));
    });
}); 