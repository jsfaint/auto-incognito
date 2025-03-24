import { describe, test, expect, beforeEach, vi, mock } from 'bun:test';
import { resetMocks } from '../mocks/chrome-api.js';

// 获取mock的chrome对象
const mockChrome = global.chrome;

// 导入被测试的模块
let getPassword, setPassword, getPasswordOption, setPasswordOption;

describe('Password 模块', () => {
    // 在每个测试前重置模拟
    beforeEach(() => {
        resetMocks();

        // 重新导入模块
        const passwordModule = require('../../lib/password.js');
        getPassword = passwordModule.getPassword;
        setPassword = passwordModule.setPassword;
        getPasswordOption = passwordModule.getPasswordOption;
        setPasswordOption = passwordModule.setPasswordOption;
    });

    test('getPassword应返回空字符串当存储中没有password', async () => {
        // 模拟chrome.storage.sync.get返回空对象
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            if (callback) callback({});
            return Promise.resolve({});
        });

        const result = await getPassword();
        expect(result).toBe('');
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('getPassword应返回存储中的password值', async () => {
        const testPassword = '123456';

        // 模拟chrome.storage.sync.get返回包含password的对象
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            if (callback) callback({ password: testPassword });
            return Promise.resolve({ password: testPassword });
        });

        const result = await getPassword();
        expect(result).toBe(testPassword);
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('setPassword应正确设置password', async () => {
        const testPassword = '123456';

        // 模拟chrome.storage.sync.set
        mockChrome.storage.sync.set.mockImplementation((items, callback) => {
            if (callback) callback();
            return Promise.resolve();
        });

        await setPassword(testPassword);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });

    test('getPasswordOption应返回undefined当存储中没有passwordOption', async () => {
        // 模拟chrome.storage.sync.get返回空对象
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            if (callback) callback({});
            return Promise.resolve({});
        });

        const result = await getPasswordOption();
        expect(result).toBeUndefined();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('getPasswordOption应返回存储中的passwordOption值', async () => {
        // 模拟chrome.storage.sync.get返回包含passwordOption的对象
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            if (callback) callback({ passwordOption: true });
            return Promise.resolve({ passwordOption: true });
        });

        const result = await getPasswordOption();
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('setPasswordOption应正确设置passwordOption', async () => {
        // 模拟chrome.storage.sync.set
        mockChrome.storage.sync.set.mockImplementation((items, callback) => {
            if (callback) callback();
            return Promise.resolve();
        });

        // 测试设置为true
        await setPasswordOption(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();

        // 重置mock
        mockChrome.storage.sync.set.mockClear();

        // 测试设置为false
        await setPasswordOption(false);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });
}); 