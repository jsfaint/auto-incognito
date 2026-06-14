import { describe, test, expect, beforeEach, vi, mock } from 'bun:test';

// Import the module under test
let findInWhitelist;

describe('Whitelist module', () => {
    // Reset and re-import the module before each test
    beforeEach(() => {
        // Re-import the module
        const whitelistModule = require('../../lib/whitelist.js');
        findInWhitelist = whitelistModule.findInWhitelist;
    });

    test('findInWhitelist should detect URLs in the whitelist', () => {
        // Test whitelisted URLs
        expect(findInWhitelist('about:blank')).toBe(true);
        expect(findInWhitelist('chrome://settings')).toBe(true);
        expect(findInWhitelist('edge://settings')).toBe(true);
    });

    test('findInWhitelist should return false for URLs not in the whitelist', () => {
        // Test non-whitelisted URLs
        expect(findInWhitelist('https://example.com')).toBe(false);
        expect(findInWhitelist('http://test.com')).toBe(false);
        expect(findInWhitelist('file:///C:/test.html')).toBe(false);
    });
}); 