// 模拟 Chrome API
const chrome = require('jest-chrome');

// 定义模拟的 chrome.storage API
chrome.storage = {
    local: {
        get: jest.fn(),
        set: jest.fn()
    },
    sync: {
        get: jest.fn(),
        set: jest.fn()
    }
};

// 定义模拟的 chrome.tabs API
chrome.tabs = {
    get: jest.fn(),
    remove: jest.fn(),
    onRemoved: {
        addListener: jest.fn(),
        removeListener: jest.fn()
    },
    onUpdated: {
        addListener: jest.fn()
    }
};

// 定义模拟的 chrome.windows API
chrome.windows = {
    create: jest.fn()
};

// 定义模拟的 chrome.history API
chrome.history = {
    deleteUrl: jest.fn()
};

// 定义模拟的 chrome.webNavigation API
chrome.webNavigation = {
    onBeforeNavigate: {
        addListener: jest.fn()
    }
};

// 设置全局 chrome 对象
global.chrome = chrome;

// 模拟 URL 对象
global.URL = function (url) {
    try {
        const urlObj = new URL(url);
        return {
            hostname: url.replace(/^https?:\/\//, '').split('/')[0]
        };
    } catch (e) {
        return { hostname: '' };
    }
}; 