const findInWhitelist = (url) => {
    const whitelist = [
        "about:blank",
        "chrome://",
        "edge://",
    ];

    return whitelist.some(item => url.includes(item));
};

// 通用导出模式，同时支持CommonJS和浏览器环境
if (typeof module !== 'undefined' && module.exports) {
    // 在Node.js/Bun环境中
    module.exports = { findInWhitelist };
}
