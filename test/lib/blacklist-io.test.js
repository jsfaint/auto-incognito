import { describe, test, expect, beforeEach, afterAll, vi } from 'bun:test';
import { resetMocks } from '../mocks/chrome-api.js';

const mockChrome = global.chrome;

// Functions under test: re-required per test for a clean closure
let exportBlacklist;
let importBlacklistFromFile;
let openBookmarkImport;

// Hold original values of document / BlackList / findInWhitelist to restore after tests
let originalDocument;
let originalBlackList;
let originalFindInWhitelist;

describe('blacklist-io module', () => {
    beforeEach(() => {
        resetMocks();

        // Save any existing global references to restore after tests
        originalDocument = global.document;
        originalBlackList = global.BlackList;
        originalFindInWhitelist = global.findInWhitelist;

        // blacklist-io.js depends on the global BlackList; load the real module via require and assign to global
        delete require.cache[require.resolve('../../lib/blacklist.js')];
        global.BlackList = require('../../lib/blacklist.js').BlackList;

        // findInWhitelist as a global function
        global.findInWhitelist = require('../../lib/whitelist.js').findInWhitelist;

        // document does not exist in the Bun test environment; mock it manually
        global.document = { createElement: vi.fn() };

        // Re-require the module under test
        delete require.cache[require.resolve('../../lib/blacklist-io.js')];
        const mod = require('../../lib/blacklist-io.js');
        exportBlacklist = mod.exportBlacklist;
        importBlacklistFromFile = mod.importBlacklistFromFile;
        openBookmarkImport = mod.openBookmarkImport;
    });

    afterAll(() => {
        // Restore global pollution
        if (originalDocument === undefined) delete global.document;
        else global.document = originalDocument;
        if (originalBlackList === undefined) delete global.BlackList;
        else global.BlackList = originalBlackList;
        if (originalFindInWhitelist === undefined) delete global.findInWhitelist;
        else global.findInWhitelist = originalFindInWhitelist;
    });

    describe('exportBlacklist', () => {
        test('should read the blacklist and trigger a file download', async () => {
            const blacklist = ['example.com', 'test.com'];
            vi.spyOn(global.BlackList, 'getAll').mockResolvedValue(blacklist);

            const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
            const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

            const anchor = { click: vi.fn() };
            global.document.createElement.mockReturnValue(anchor);

            await exportBlacklist();

            // Verify the blacklist was read
            expect(global.BlackList.getAll).toHaveBeenCalledTimes(1);
            // Verify a Blob was created (via the createObjectURL argument)
            expect(createObjectURL).toHaveBeenCalledTimes(1);
            const blob = createObjectURL.mock.calls[0][0];
            expect(blob).toBeInstanceOf(Blob);
            // Verify the download anchor configuration
            expect(anchor.href).toBe('blob:test-url');
            expect(anchor.download).toBe('blacklist.txt');
            expect(anchor.click).toHaveBeenCalledTimes(1);
            // Verify the object URL was released
            expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
        });
    });

    describe('importBlacklistFromFile', () => {
        test('should merge file contents with the existing blacklist and dedupe on write', async () => {
            const file = { text: vi.fn().mockResolvedValue('new1.com\nnew2.com\nnew1.com') };
            vi.spyOn(global.BlackList, 'getAll').mockResolvedValue(['existing.com', 'new1.com']);
            const setSpy = vi.spyOn(global.BlackList, 'set').mockResolvedValue(true);

            const count = await importBlacklistFromFile(file);

            // Return value = file lines passing whitelist filter (in-file duplicates count too)
            expect(count).toBe(3);
            // Written result = existing + filtered, deduped via Set; new1.com is not duplicated
            expect(setSpy).toHaveBeenCalledWith(['existing.com', 'new1.com', 'new2.com']);
        });

        test('should filter out whitelisted URLs', async () => {
            const file = {
                text: vi.fn().mockResolvedValue('about:blank\nchrome://settings\nexample.com'),
            };
            vi.spyOn(global.BlackList, 'getAll').mockResolvedValue([]);
            const setSpy = vi.spyOn(global.BlackList, 'set').mockResolvedValue(true);

            const count = await importBlacklistFromFile(file);

            // Only example.com passes the whitelist filter
            expect(count).toBe(1);
            expect(setSpy).toHaveBeenCalledWith(['example.com']);
        });

        test('should ignore blank lines', async () => {
            const file = {
                text: vi.fn().mockResolvedValue('a.com\n\n  \nb.com'),
            };
            vi.spyOn(global.BlackList, 'getAll').mockResolvedValue([]);
            const setSpy = vi.spyOn(global.BlackList, 'set').mockResolvedValue(true);

            const count = await importBlacklistFromFile(file);

            expect(count).toBe(2);
            expect(setSpy).toHaveBeenCalledWith(['a.com', 'b.com']);
        });

        test('should dedupe on write and return the filtered line count when file fully duplicates the blacklist', async () => {
            const file = { text: vi.fn().mockResolvedValue('existing.com\nabout:blank') };
            vi.spyOn(global.BlackList, 'getAll').mockResolvedValue(['existing.com']);
            const setSpy = vi.spyOn(global.BlackList, 'set').mockResolvedValue(true);

            const count = await importBlacklistFromFile(file);

            // about:blank is filtered by the whitelist; only existing.com counts toward the return value
            expect(count).toBe(1);
            // After Set dedupe only existing.com remains (one set write)
            expect(setSpy).toHaveBeenCalledWith(['existing.com']);
        });
    });

    describe('openBookmarkImport', () => {
        test('should call chrome.tabs.create to open bookmark.html', () => {
            openBookmarkImport();

            expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('bookmark.html');
            expect(mockChrome.tabs.create).toHaveBeenCalledWith({
                url: 'chrome-extension://9527/bookmark.html',
            });
        });
    });
});
