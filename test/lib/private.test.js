import { describe, test, expect, beforeEach, vi, mock } from 'bun:test';
import { resetMocks } from '../mocks/chrome-api.js';

// Get the mocked chrome object
const mockChrome = global.chrome;

// Import the module under test
let getPrivateOption, setPrivateOption;

describe('Private module', () => {
    // Reset mocks before each test
    beforeEach(() => {
        resetMocks();

        // Re-import the module
        const privateModule = require('../../lib/private.js');
        getPrivateOption = privateModule.getPrivateOption;
        setPrivateOption = privateModule.setPrivateOption;
    });

    test('getPrivateOption should return undefined when storage has no private option', async () => {
        // Mock chrome.storage.sync.get to return an empty object
        mockChrome.storage.sync.get.mockResolvedValue({});

        const result = await getPrivateOption();
        expect(result).toBeUndefined();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('getPrivateOption should return the stored private value', async () => {
        // Mock chrome.storage.sync.get to return an object containing the private option
        mockChrome.storage.sync.get.mockResolvedValue({ private: true });

        const result = await getPrivateOption();
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('setPrivateOption should correctly set the private option', async () => {
        // Mock chrome.storage.sync.set
        mockChrome.storage.sync.set.mockResolvedValue();

        // Test setting to true
        await setPrivateOption(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();

        // Reset mock
        mockChrome.storage.sync.set.mockClear();

        // Test setting to false
        await setPrivateOption(false);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });
});