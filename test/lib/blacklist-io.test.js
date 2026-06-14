import { describe, test, expect, beforeEach, afterAll, vi } from 'bun:test';
import { resetMocks } from '../mocks/chrome-api.js';

const mockChrome = global.chrome;

// 被测函数：每个测试重新 require 以获得干净闭包
let exportBlacklist;
let importBlacklistFromFile;
let openBookmarkImport;

// 存放 document / BlackList / findInWhitelist 的原始值，测试后还原
let originalDocument;
let originalBlackList;
let originalFindInWhitelist;

describe('blacklist-io 模块', () => {
    beforeEach(() => {
        resetMocks();

        // 保存可能存在的全局引用，测试后还原
        originalDocument = global.document;
        originalBlackList = global.BlackList;
        originalFindInWhitelist = global.findInWhitelist;

        // blacklist-io.js 依赖全局 BlackList；用 require 加载真实模块并赋给 global
        delete require.cache[require.resolve('../../lib/blacklist.js')];
        global.BlackList = require('../../lib/blacklist.js').BlackList;

        // findInWhitelist 作为全局函数
        global.findInWhitelist = require('../../lib/whitelist.js').findInWhitelist;

        // document 在 Bun 测试环境不存在，需要手动 mock
        global.document = { createElement: vi.fn() };

        // 重新 require 被测模块
        delete require.cache[require.resolve('../../lib/blacklist-io.js')];
        const mod = require('../../lib/blacklist-io.js');
        exportBlacklist = mod.exportBlacklist;
        importBlacklistFromFile = mod.importBlacklistFromFile;
        openBookmarkImport = mod.openBookmarkImport;
    });

    afterAll(() => {
        // 还原全局污染
        if (originalDocument === undefined) delete global.document;
        else global.document = originalDocument;
        if (originalBlackList === undefined) delete global.BlackList;
        else global.BlackList = originalBlackList;
        if (originalFindInWhitelist === undefined) delete global.findInWhitelist;
        else global.findInWhitelist = originalFindInWhitelist;
    });

    describe('exportBlacklist', () => {
        test('应读取黑名单并触发文件下载', async () => {
            const blacklist = ['example.com', 'test.com'];
            vi.spyOn(global.BlackList, 'getAll').mockResolvedValue(blacklist);

            const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
            const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

            const anchor = { click: vi.fn() };
            global.document.createElement.mockReturnValue(anchor);

            await exportBlacklist();

            // 验证读取黑名单
            expect(global.BlackList.getAll).toHaveBeenCalledTimes(1);
            // 验证创建了 Blob（通过 createObjectURL 入参）
            expect(createObjectURL).toHaveBeenCalledTimes(1);
            const blob = createObjectURL.mock.calls[0][0];
            expect(blob).toBeInstanceOf(Blob);
            // 验证下载锚点配置
            expect(anchor.href).toBe('blob:test-url');
            expect(anchor.download).toBe('blacklist.txt');
            expect(anchor.click).toHaveBeenCalledTimes(1);
            // 验证释放对象 URL
            expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
        });
    });

    describe('importBlacklistFromFile', () => {
        test('应合并文件内容与现有黑名单并去重写入', async () => {
            const file = { text: vi.fn().mockResolvedValue('new1.com\nnew2.com\nnew1.com') };
            vi.spyOn(global.BlackList, 'getAll').mockResolvedValue(['existing.com', 'new1.com']);
            const setSpy = vi.spyOn(global.BlackList, 'set').mockResolvedValue(true);

            const count = await importBlacklistFromFile(file);

            // 返回值 = 通过白名单过滤的文件行数（文件内重复也算）
            expect(count).toBe(3);
            // 写入结果 = 现有 + 过滤后做 Set 去重，new1.com 不重复
            expect(setSpy).toHaveBeenCalledWith(['existing.com', 'new1.com', 'new2.com']);
        });

        test('应过滤掉白名单中的 URL', async () => {
            const file = {
                text: vi.fn().mockResolvedValue('about:blank\nchrome://settings\nexample.com'),
            };
            vi.spyOn(global.BlackList, 'getAll').mockResolvedValue([]);
            const setSpy = vi.spyOn(global.BlackList, 'set').mockResolvedValue(true);

            const count = await importBlacklistFromFile(file);

            // 仅 example.com 通过白名单过滤
            expect(count).toBe(1);
            expect(setSpy).toHaveBeenCalledWith(['example.com']);
        });

        test('应忽略空行', async () => {
            const file = {
                text: vi.fn().mockResolvedValue('a.com\n\n  \nb.com'),
            };
            vi.spyOn(global.BlackList, 'getAll').mockResolvedValue([]);
            const setSpy = vi.spyOn(global.BlackList, 'set').mockResolvedValue(true);

            const count = await importBlacklistFromFile(file);

            expect(count).toBe(2);
            expect(setSpy).toHaveBeenCalledWith(['a.com', 'b.com']);
        });

        test('文件内容与现有黑名单完全重复时应去重写入并返回过滤行数', async () => {
            const file = { text: vi.fn().mockResolvedValue('existing.com\nabout:blank') };
            vi.spyOn(global.BlackList, 'getAll').mockResolvedValue(['existing.com']);
            const setSpy = vi.spyOn(global.BlackList, 'set').mockResolvedValue(true);

            const count = await importBlacklistFromFile(file);

            // about:blank 被白名单过滤，仅 existing.com 计入返回值
            expect(count).toBe(1);
            // 合并 Set 去重后只有 existing.com（一次 set 写入）
            expect(setSpy).toHaveBeenCalledWith(['existing.com']);
        });
    });

    describe('openBookmarkImport', () => {
        test('应调用 chrome.tabs.create 打开 bookmark.html', () => {
            openBookmarkImport();

            expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('bookmark.html');
            expect(mockChrome.tabs.create).toHaveBeenCalledWith({
                url: 'chrome-extension://9527/bookmark.html',
            });
        });
    });
});
