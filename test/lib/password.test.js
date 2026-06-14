import { describe, test, expect, beforeEach, vi, mock } from 'bun:test';
import { resetMocks } from '../mocks/chrome-api.js';

// Get the mocked chrome object
const mockChrome = global.chrome;

// Import the module under test
let getPassword, setPassword, isPasswordOptionEnabled, setPasswordOption;

describe('Password module', () => {
    // Reset mocks before each test
    beforeEach(() => {
        resetMocks();

        // Re-import the module
        const passwordModule = require('../../lib/password.js');
        getPassword = passwordModule.getPassword;
        setPassword = passwordModule.setPassword;
        isPasswordOptionEnabled = passwordModule.isPasswordOptionEnabled;
        setPasswordOption = passwordModule.setPasswordOption;
    });

    test('getPassword should return an empty string when storage has no password', async () => {
        // Mock chrome.storage.sync.get to return an empty object
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            if (callback) callback({});
            return Promise.resolve({});
        });

        const result = await getPassword();
        expect(result).toBe('');
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('getPassword should return the stored password value', async () => {
        const testPassword = '123456';

        // Mock chrome.storage.sync.get to return an object containing password
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            if (callback) callback({ password: testPassword });
            return Promise.resolve({ password: testPassword });
        });

        const result = await getPassword();
        expect(result).toBe(testPassword);
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('setPassword should correctly set the password', async () => {
        const testPassword = '123456';

        // Mock chrome.storage.sync.set
        mockChrome.storage.sync.set.mockImplementation((items, callback) => {
            if (callback) callback();
            return Promise.resolve();
        });

        await setPassword(testPassword);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });

    test('isPasswordOptionEnabled should return undefined when storage has no passwordOption', async () => {
        // Mock chrome.storage.sync.get to return an empty object
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            if (callback) callback({});
            return Promise.resolve({});
        });

        const result = await isPasswordOptionEnabled();
        expect(result).toBeUndefined();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('isPasswordOptionEnabled should return the stored passwordOption value', async () => {
        // Mock chrome.storage.sync.get to return an object containing passwordOption
        mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
            if (callback) callback({ passwordOption: true });
            return Promise.resolve({ passwordOption: true });
        });

        const result = await isPasswordOptionEnabled();
        expect(result).toBe(true);
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    test('setPasswordOption should correctly set passwordOption', async () => {
        // Mock chrome.storage.sync.set
        mockChrome.storage.sync.set.mockImplementation((items, callback) => {
            if (callback) callback();
            return Promise.resolve();
        });

        // Test setting to true
        await setPasswordOption(true);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();

        // Reset mock
        mockChrome.storage.sync.set.mockClear();

        // Test setting to false
        await setPasswordOption(false);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });
}); 