const findInWhitelist = (url) => {
    const whitelist = [
        "about:blank",
        "chrome://",
        "edge://",
    ];

    return whitelist.some(item => url.startsWith(item));
};

// Common export pattern, supporting both CommonJS and browser environments
if (typeof module !== 'undefined' && module.exports) {
    // In Node.js/Bun environment
    module.exports = { findInWhitelist };
}
