import { describe, test, expect, beforeEach, vi, mock } from 'bun:test';
import { resetMocks } from '../mocks/chrome-api.js';

// Import the module under test
const mockChrome = global.chrome;

// Manually import the BlackList object
let BlackList;
let _onChangedHandler;

describe('BlackList module', () => {
    // Reset mocks and clear the in-memory cache before each test
    beforeEach(() => {
        resetMocks();

        // Clear the module cache so the module re-executes: _blacklistCache resets
        // to null naturally, and the onChanged listener re-registers
        // (clearAllMocks wipes the call recordings).
        delete require.cache[require.resolve('../../lib/blacklist.js')];

        const blacklistModule = require('../../lib/blacklist.js');
        BlackList = blacklistModule.BlackList || blacklistModule.default || blacklistModule;
        _onChangedHandler = blacklistModule._onChangedHandler;
    });

    test('getAll should return an empty array when storage has no blacklist', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({});

        const result = await BlackList.getAll();
        expect(result).toEqual([]);
        expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['blacklist']);
    });

    test('getAll should return the blacklist array from storage', async () => {
        const mockBlacklist = ['example.com', 'test.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: mockBlacklist });

        const result = await BlackList.getAll();
        expect(result).toEqual(mockBlacklist);
        expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['blacklist']);
    });

    test('add should add a new URL to the blacklist', async () => {
        const existingBlacklist = ['example.com'];
        const newUrl = 'test.com';
        const expectedBlacklist = [...existingBlacklist, newUrl];

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });
        mockChrome.storage.sync.set.mockResolvedValue();

        const result = await BlackList.add(newUrl);
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ blacklist: expectedBlacklist });
    });

    test('add should return false if the URL already exists', async () => {
        const existingUrl = 'example.com';
        const existingBlacklist = [existingUrl];

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });

        const result = await BlackList.add(existingUrl);
        expect(result).toBe(false);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('remove should remove the given URL from the blacklist', async () => {
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

    test('remove should return false if the URL does not exist', async () => {
        const existingBlacklist = ['example.com'];
        const nonExistingUrl = 'nonexisting.com';

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });

        const result = await BlackList.remove(nonExistingUrl);
        expect(result).toBe(false);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('check should correctly detect whether a URL is in the blacklist', async () => {
        const blacklist = ['example.com', 'test.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist });

        // Matching URL
        let result = await BlackList.check('https://example.com/path');
        expect(result).toBe(true);

        // Subdomains should also match
        result = await BlackList.check('https://sub.example.com/path');
        expect(result).toBe(true);

        // Non-matching URL
        result = await BlackList.check('https://other.com/path');
        expect(result).toBe(false);
    });

    test('check should not falsely match a substring pattern against an unrelated domain', async () => {
        // Regression test: the old hostname.includes(pattern) logic let "x.com" falsely match "realibox.com"
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['x.com'] });

        const result = await BlackList.check('https://realibox.com/path');
        expect(result).toBe(false);
    });

    test('check should correctly match subdomains', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['x.com'] });

        expect(await BlackList.check('https://www.x.com/path')).toBe(true);
        expect(await BlackList.check('https://mail.x.com/path')).toBe(true);
    });

    test('check should match a domain exactly and reject prefix-collision domains', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['google.com'] });

        // Exact hit
        expect(await BlackList.check('https://google.com/path')).toBe(true);
        // Second-level subdomain hit
        expect(await BlackList.check('https://mail.google.com/path')).toBe(true);
        // A prefix-collision domain must not match (the old logic would falsely hit)
        expect(await BlackList.check('https://fakegoogle.com/path')).toBe(false);
    });

    test('check no longer special-cases builtin pages; it only matches the URL hostname against the blacklist', async () => {
        // check()'s responsibility has converged to "does the URL hostname match the blacklist";
        // whether to skip builtin pages is decided by the caller (privateModeHandler's
        // isBuiltinPage check). The hostname of a builtin page URL is the extension id
        // (chrome.runtime.id), which never appears in the blacklist, so it should return false.
        // This test locks that contract to prevent isBuiltinPage checks from being put back into check().
        const blacklist = ['example.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist });

        const builtinUrl = `chrome-extension://${mockChrome.runtime.id}/blacklist-manager.html`;
        const result = await BlackList.check(builtinUrl);
        expect(result).toBe(false);
    });

    test('set should correctly set the blacklist', async () => {
        const newBlacklist = ['domain1.com', 'domain2.com'];
        mockChrome.storage.sync.set.mockResolvedValue();

        const result = await BlackList.set(newBlacklist);
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ blacklist: newBlacklist });
    });

    test('removeBatch should remove multiple URLs in bulk', async () => {
        const urls = ['example.com', 'test.com', 'sample.com'];
        const remainingUrl = 'remaining.com';
        const existingBlacklist = [...urls, remainingUrl];
        const expectedBlacklist = [remainingUrl];

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });
        mockChrome.storage.sync.set.mockResolvedValue();

        const result = await BlackList.removeBatch(urls);
        expect(result).toBe(3); // should return the number removed
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ blacklist: expectedBlacklist });
    });

    test('removeBatch should return 0 for an empty array or invalid input', async () => {
        const existingBlacklist = ['example.com', 'test.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });

        // Test empty array
        let result = await BlackList.removeBatch([]);
        expect(result).toBe(0);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();

        // Test null
        result = await BlackList.removeBatch(null);
        expect(result).toBe(0);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();

        // Test undefined
        result = await BlackList.removeBatch(undefined);
        expect(result).toBe(0);
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('removeBatch should handle non-existent URLs correctly', async () => {
        const existingBlacklist = ['example.com', 'test.com'];
        const nonExistingUrls = ['nonexisting1.com', 'nonexisting2.com'];

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });

        const result = await BlackList.removeBatch(nonExistingUrls);
        expect(result).toBe(0); // no URL was deleted
        expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('removeBatch should handle partially existing URLs correctly', async () => {
        const existingUrl = 'example.com';
        const nonExistingUrl = 'nonexisting.com';
        const existingBlacklist = [existingUrl, 'test.com'];
        const expectedBlacklist = ['test.com'];

        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: existingBlacklist });
        mockChrome.storage.sync.set.mockResolvedValue();

        const result = await BlackList.removeBatch([existingUrl, nonExistingUrl]);
        expect(result).toBe(1); // only one URL was deleted
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ blacklist: expectedBlacklist });
    });

    // ===== Cache behavior tests =====

    test('getAll should cache the result; the second call must not hit storage', async () => {
        const mockBlacklist = ['cached.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: mockBlacklist });

        const first = await BlackList.getAll();
        const second = await BlackList.getAll();

        expect(first).toEqual(mockBlacklist);
        expect(second).toEqual(mockBlacklist);
        // Only the first call triggers a storage read
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });

    test('getAll should return the same reference on a cache hit', async () => {
        const mockBlacklist = ['ref.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: mockBlacklist });

        const first = await BlackList.getAll();
        const second = await BlackList.getAll();

        // Cache returns the same array reference (preserving existing behavior: writes mutate in place)
        expect(second).toBe(first);
    });

    test('add should update the cache', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['a.com'] });
        mockChrome.storage.sync.set.mockResolvedValue();

        await BlackList.add('b.com');

        // The cache should contain the new item; a subsequent getAll does not hit storage
        const getCallsBefore = mockChrome.storage.sync.get.mock.calls.length;
        const result = await BlackList.getAll();
        expect(result).toEqual(['a.com', 'b.com']);
        expect(mockChrome.storage.sync.get.mock.calls.length).toBe(getCallsBefore);
    });

    test('set should update the cache', async () => {
        mockChrome.storage.sync.set.mockResolvedValue();
        const newBlacklist = ['x.com', 'y.com'];

        await BlackList.set(newBlacklist);

        const getCallsBefore = mockChrome.storage.sync.get.mock.calls.length;
        const result = await BlackList.getAll();
        expect(result).toEqual(newBlacklist);
        expect(mockChrome.storage.sync.get.mock.calls.length).toBe(getCallsBefore);
    });

    test('remove should update the cache', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['a.com', 'b.com'] });
        mockChrome.storage.sync.set.mockResolvedValue();

        await BlackList.remove('a.com');

        const getCallsBefore = mockChrome.storage.sync.get.mock.calls.length;
        const result = await BlackList.getAll();
        expect(result).toEqual(['b.com']);
        expect(mockChrome.storage.sync.get.mock.calls.length).toBe(getCallsBefore);
    });

    test('removeBatch should update the cache', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['a.com', 'b.com', 'c.com'] });
        mockChrome.storage.sync.set.mockResolvedValue();

        await BlackList.removeBatch(['a.com', 'b.com']);

        const getCallsBefore = mockChrome.storage.sync.get.mock.calls.length;
        const result = await BlackList.getAll();
        expect(result).toEqual(['c.com']);
        expect(mockChrome.storage.sync.get.mock.calls.length).toBe(getCallsBefore);
    });

    test('check should not re-read storage on a cache hit', async () => {
        const blacklist = ['hit.com'];
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist });

        await BlackList.check('https://hit.com/path');
        await BlackList.check('https://hit.com/other');

        // Multiple check calls trigger only one storage read
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });

    test('should register a chrome.storage.onChanged listener on module load', () => {
        // beforeEach re-requires so the module executes again; vi.clearAllMocks already
        // wiped the records, so the addListener call observed here comes from the current require.
        expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalledTimes(1);
        // The registered handler must be the exported _onChangedHandler, not dead code registered by mistake.
        expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalledWith(_onChangedHandler);
    });

    test('the named export of the onChanged handler can be invoked directly', () => {
        expect(typeof _onChangedHandler).toBe('function');
    });

    test('onChanged handler should invalidate the cache on a sync-area blacklist change', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['a.com'] });

        // First read populates the cache
        await BlackList.getAll();
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);

        // Simulate an external storage change triggering onChanged
        _onChangedHandler({ blacklist: { newValue: ['b.com'] } }, 'sync');

        // After cache invalidation, getAll should re-read storage
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['b.com'] });
        const result = await BlackList.getAll();
        expect(result).toEqual(['b.com']);
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(2);
    });

    test('onChanged handler should not invalidate the cache for non-sync areas or non-blacklist changes', async () => {
        mockChrome.storage.sync.get.mockResolvedValue({ blacklist: ['a.com'] });

        await BlackList.getAll();
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);

        // A local-area change must not affect the sync cache
        _onChangedHandler({ blacklist: { newValue: ['b.com'] } }, 'local');
        // A sync-area change without the blacklist key
        _onChangedHandler({ other: { newValue: 1 } }, 'sync');

        const result = await BlackList.getAll();
        expect(result).toEqual(['a.com']);
        expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });
});
