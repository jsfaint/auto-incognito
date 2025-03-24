import { describe, test, expect, beforeEach, vi, mock } from 'bun:test';
import { resetMocks } from '../mocks/chrome-api.js';

// 获取mock的chrome对象
const mockChrome = global.chrome;

// 导入被测试的模块
let getPrivateOption, setPrivateOption;

describe('Private 模块', () => {
    // 在每个测试前重置模拟
    beforeEach(() => {
        resetMocks();

        // 重新导入模块
        const privateModule = require('../../lib/private.js');
        getPrivateOption = privateModule.getPrivateOption;
        setPrivateOption = privateModule.setPrivateOption;
    });

    test('getPrivateOption应返回undefined当存储中没有private选项', async () => {
        // 模拟chrome.storage.sync.get返回空对象
        mockChrome.storage.sync.get.mockResolvedValue({});

        const result = await getPrivateOption();
        expect(result).toBeUndefined();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('getPrivateOption应返回存储中的private值', async () => {
        // 模拟chrome.storage.sync.get返回包含private选项的对象
        mockChrome.storage.sync.get.mockResolvedValue({ private: true });

        const result = await getPrivateOption();
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('setPrivateOption应正确设置private选项', async () => {
        // 模拟chrome.storage.sync.set
        mockChrome.storage.sync.set.mockResolvedValue();

        // 测试设置为true
        await setPrivateOption(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();

        // 重置mock
        mockChrome.storage.sync.set.mockClear();

        // 测试设置为false
        await setPrivateOption(false);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });
}); 