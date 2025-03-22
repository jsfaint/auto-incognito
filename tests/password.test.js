const { getPassword, setPassword, getPasswordOption, setPasswordOption } = require('./lib/password.mock');

describe('Password Functions', () => {
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

    describe('getPassword', () => {
        test('应该返回空字符串，当没有设置密码时', async () => {
            const result = await getPassword();
            expect(result).toBe('');
            expect(chrome.storage.sync.get).toHaveBeenCalledWith('password');
        });

        test('应该返回已设置的密码', async () => {
            // 模拟返回密码
            chrome.storage.sync.get.mockImplementation((key, callback) => {
                callback({ password: 'test123' });
            });

            const result = await getPassword();
            expect(result).toBe('test123');
        });
    });

    describe('setPassword', () => {
        test('应该设置新密码', async () => {
            await setPassword('newPassword123');
            expect(chrome.storage.sync.set).toHaveBeenCalledWith({ password: 'newPassword123' });
        });

        test('应该可以设置空密码', async () => {
            await setPassword('');
            expect(chrome.storage.sync.set).toHaveBeenCalledWith({ password: '' });
        });
    });

    describe('getPasswordOption', () => {
        test('应该返回undefined，当没有设置密码选项时', async () => {
            const result = await getPasswordOption();
            expect(result).toBeUndefined();
            expect(chrome.storage.sync.get).toHaveBeenCalledWith(['passwordOption']);
        });

        test('应该返回true，当密码选项设置为true时', async () => {
            // 模拟返回true
            chrome.storage.sync.get.mockImplementation((key, callback) => {
                callback({ passwordOption: true });
            });

            const result = await getPasswordOption();
            expect(result).toBe(true);
        });

        test('应该返回false，当密码选项设置为false时', async () => {
            // 模拟返回false
            chrome.storage.sync.get.mockImplementation((key, callback) => {
                callback({ passwordOption: false });
            });

            const result = await getPasswordOption();
            expect(result).toBe(false);
        });
    });

    describe('setPasswordOption', () => {
        test('应该设置密码选项为true', async () => {
            await setPasswordOption(true);
            expect(chrome.storage.sync.set).toHaveBeenCalledWith({ passwordOption: true });
        });

        test('应该设置密码选项为false', async () => {
            await setPasswordOption(false);
            expect(chrome.storage.sync.set).toHaveBeenCalledWith({ passwordOption: false });
        });
    });
});