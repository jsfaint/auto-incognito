import { describe, test, expect, beforeEach, vi, mock } from 'bun:test';
import { resetMocks } from '../mocks/chrome-api.js';

// 导入被测试的模块
const mockChrome = global.chrome;

// 手动导入BlackList对象
let BlackList;
let _onChangedHandler;

describe('BlackList 模块', () => {
    // 在每个测试前重置模拟并清空内存缓存
    beforeEach(() => {
        resetMocks();

        // 清除模块缓存使模块重新执行：_blacklistCache 自然重置为 null，
        // onChanged 监听器重新注册（clearAllMocks 会清空调用记录）。
        delete require.cache[require.resolve('../../lib/blacklist.js')];

        const blacklistModule = require('../../lib/blacklist.js');
        BlackList = blacklistModule.BlackList || blacklistModule.default || blacklistModule;
        _onChangedHandler = blacklistModule._onChangedHandler;
    });

    test('getAll方法应返回空数组当存储中没有blacklist', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({});

        const result = await BlackList.getAll();
        expect(result).toEqual([]);
        expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['blacklist']);
    });

    test('getAll方法应返回存储中的blacklist数组', async () => {
        const mockBlacklist = ['example.com', 'test.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: mockBlacklist });

        const result = await BlackList.getAll();
        expect(result).toEqual(mockBlacklist);
        expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['blacklist']);
    });

    test('add方法应添加新URL到blacklist', async () => {
        const existingBlacklist = ['example.com'];
        const newUrl = 'test.com';
        const expectedBlacklist = [...existingBlacklist, newUrl];

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });
        mockChrome.storage.sync.set.mockResolvedValue();

        const result = await BlackList.add(newUrl);
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ blacklist: expectedBlacklist });
    });

    test('add方法如果URL已存在应返回false', async () => {
        const existingUrl = 'example.com';
        const existingBlacklist = [existingUrl];

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });

        const result = await BlackList.add(existingUrl);
        expect(result).toBe(false);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('remove方法应从blacklist中移除指定URL', async () => {
        const url1 = 'example.com';
        const url2 = 'test.com';
        const existingBlacklist = [url1, url2];
        const expectedBlacklist = [url2];

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });
        mockChrome.storage.sync.set.mockResolvedValue();

        const result = await BlackList.remove(url1);
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ blacklist: expectedBlacklist });
    });

    test('remove方法如果URL不存在应返回false', async () => {
        const existingBlacklist = ['example.com'];
        const nonExistingUrl = 'nonexisting.com';

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });

        const result = await BlackList.remove(nonExistingUrl);
        expect(result).toBe(false);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('check方法应正确检测URL是否在黑名单中', async () => {
        const blacklist = ['example.com', 'test.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist });

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

    test('set方法应正确设置blacklist', async () => {
        const newBlacklist = ['domain1.com', 'domain2.com'];
        mockChrome.storage.sync.set.mockResolvedValue();

        const result = await BlackList.set(newBlacklist);
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ blacklist: newBlacklist });
    });

    test('removeBatch方法应批量移除多个URL', async () => {
        const urls = ['example.com', 'test.com', 'sample.com'];
        const remainingUrl = 'remaining.com';
        const existingBlacklist = [...urls, remainingUrl];
        const expectedBlacklist = [remainingUrl];

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });
        mockChrome.storage.sync.set.mockResolvedValue();

        const result = await BlackList.removeBatch(urls);
        expect(result).toBe(3); // 应返回移除的数量
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ blacklist: expectedBlacklist });
    });

    test('removeBatch方法对空数组或无效输入应返回0', async () => {
        const existingBlacklist = ['example.com', 'test.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });

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

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });

        const result = await BlackList.removeBatch(nonExistingUrls);
        expect(result).toBe(0); // 没有任何URL被删除
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('removeBatch方法对部分存在的URL应正确处理', async () => {
        const existingUrl = 'example.com';
        const nonExistingUrl = 'nonexisting.com';
        const existingBlacklist = [existingUrl, 'test.com'];
        const expectedBlacklist = ['test.com'];

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });
        mockChrome.storage.sync.set.mockResolvedValue();

        const result = await BlackList.removeBatch([existingUrl, nonExistingUrl]);
        expect(result).toBe(1); // 只有一个URL被删除
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ blacklist: expectedBlacklist });
    });

    // ===== 缓存行为测试 =====

    test('getAll方法应缓存结果，第二次调用不再访问storage', async () => {
        const mockBlacklist = ['cached.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: mockBlacklist });

        const first = await BlackList.getAll();
        const second = await BlackList.getAll();

        expect(first).toEqual(mockBlacklist);
        expect(second).toEqual(mockBlacklist);
        // 仅第一次触发 storage 读取
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });

    test('getAll方法缓存命中时返回的是同一引用', async () => {
        const mockBlacklist = ['ref.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: mockBlacklist });

        const first = await BlackList.getAll();
        const second = await BlackList.getAll();

        // 缓存返回同一数组引用（保留既有行为：写操作就地 mutate）
        expect(second).toBe(first);
    });

    test('add方法应更新缓存', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['a.com'] });
        mockChrome.storage.sync.set.mockResolvedValue();

        await BlackList.add('b.com');

        // 缓存应包含新增项；再次 getAll 不触发 storage 读取
        const getCallsBefore = mockChrome.storage.sync.get.mock.calls.length;
        const result = await BlackList.getAll();
        expect(result).toEqual(['a.com', 'b.com']);
        expect(mockChrome.storage.sync.get.mock.calls.length).toBe(getCallsBefore);
    });

    test('set方法应更新缓存', async () => {
        mockChrome.storage.sync.set.mockResolvedValue();
        const newBlacklist = ['x.com', 'y.com'];

        await BlackList.set(newBlacklist);

        const getCallsBefore = mockChrome.storage.sync.get.mock.calls.length;
        const result = await BlackList.getAll();
        expect(result).toEqual(newBlacklist);
        expect(mockChrome.storage.sync.get.mock.calls.length).toBe(getCallsBefore);
    });

    test('remove方法应更新缓存', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['a.com', 'b.com'] });
        mockChrome.storage.sync.set.mockResolvedValue();

        await BlackList.remove('a.com');

        const getCallsBefore = mockChrome.storage.sync.get.mock.calls.length;
        const result = await BlackList.getAll();
        expect(result).toEqual(['b.com']);
        expect(mockChrome.storage.sync.get.mock.calls.length).toBe(getCallsBefore);
    });

    test('removeBatch方法应更新缓存', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['a.com', 'b.com', 'c.com'] });
        mockChrome.storage.sync.set.mockResolvedValue();

        await BlackList.removeBatch(['a.com', 'b.com']);

        const getCallsBefore = mockChrome.storage.sync.get.mock.calls.length;
        const result = await BlackList.getAll();
        expect(result).toEqual(['c.com']);
        expect(mockChrome.storage.sync.get.mock.calls.length).toBe(getCallsBefore);
    });

    test('check方法缓存命中时不重复读取storage', async () => {
        const blacklist = ['hit.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist });

        await BlackList.check('https://hit.com/path');
        await BlackList.check('https://hit.com/other');

        // 多次 check 仅触发一次 storage 读取
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });

    test('模块加载时应注册chrome.storage.onChanged监听器', () => {
        // beforeEach 重新 require 使模块再次执行；vi.clearAllMocks 已清空记录，
        // 因此本次观察到的 addListener 调用来自当前 require。
        expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalledTimes(1);
        // 注册的处理器必须是导出的 _onChangedHandler，避免注册了错误的死代码。
        expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalledWith(_onChangedHandler);
    });

    test('onChanged处理器的具名导出可直接调用', () => {
        expect(typeof _onChangedHandler).toBe('function');
    });

    test('onChanged处理器应在sync区域的blacklist变更时使缓存失效', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['a.com'] });

        // 首次读取填充缓存
        await BlackList.getAll();
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);

        // 模拟外部 storage 变更触发 onChanged
        _onChangedHandler({ blacklist: { newValue: ['b.com'] } }, 'sync');

        // 缓存失效后再次 getAll 应重新读取 storage
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['b.com'] });
        const result = await BlackList.getAll();
        expect(result).toEqual(['b.com']);
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(2);
    });

    test('onChanged处理器对非sync区域或无blacklist变更不应失效缓存', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['a.com'] });

        await BlackList.getAll();
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);

        // local 区域变更不影响 sync 缓存
        _onChangedHandler({ blacklist: { newValue: ['b.com'] } }, 'local');
        // sync 区域但无 blacklist 键变更
        _onChangedHandler({ other: { newValue: 1 } }, 'sync');

        const result = await BlackList.getAll();
        expect(result).toEqual(['a.com']);
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });
});
