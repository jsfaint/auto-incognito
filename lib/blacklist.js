// 黑名单内存缓存：避免 check() 在每次 tab 导航/历史访问时都读取 storage。
// 写操作成功后同步更新缓存；chrome.storage.onChanged 监听外部变更使缓存失效。
let _blacklistCache = null;

// onChanged 处理器：其他扩展页面修改黑名单时使缓存失效。
// 提取为具名函数并导出，便于测试直接调用而无需依赖 mock 调用记录。
function _onChangedHandler(changes, areaName) {
    if (areaName === 'sync' && changes.blacklist) {
        _blacklistCache = null;
    }
}

const BlackList = {
    // Check if URL is a builtin extension page
    isBuiltinPage: function (url) {
        if (!url) return false;

        const extensionId = chrome.runtime.id;
        const builtin_pages = [
            //Microsoft Edge
            `extension://${extensionId}/blacklist-manager.html`,
            `extension://${extensionId}/bookmark.html`,
            //Google Chrome
            `chrome-extension://${extensionId}/blacklist-manager.html`,
            `chrome-extension://${extensionId}/bookmark.html`,
        ];

        return builtin_pages.some(extensionUrl => url === extensionUrl);
    },

    // Get all blacklist items (cache-first)
    getAll: async function () {
        if (_blacklistCache !== null) return _blacklistCache;

        const result = await chrome.storage.sync.get(['blacklist']);
        _blacklistCache = result.blacklist || [];
        return _blacklistCache;
    },

    // Add item to blacklist
    add: async function (url) {
        const blacklist = await this.getAll();

        // If already exists, return directly
        if (blacklist.includes(url)) {
            return false;
        }

        // Add new item and save
        blacklist.push(url);
        await chrome.storage.sync.set({ blacklist });
        _blacklistCache = blacklist;
        return true;
    },

    // Remove item from blacklist
    remove: async function (url) {
        const blacklist = await this.getAll();
        const index = blacklist.indexOf(url);

        // If not exists, return directly
        if (index === -1) {
            return false;
        }

        // Remove item and save
        blacklist.splice(index, 1);
        await chrome.storage.sync.set({ blacklist });
        _blacklistCache = blacklist;
        return true;
    },

    // Batch remove blacklist items
    removeBatch: async function (urls) {
        if (!urls || !urls.length) return 0;

        const blacklist = await this.getAll();
        let count = 0;

        urls.forEach(url => {
            const index = blacklist.indexOf(url);
            if (index !== -1) {
                blacklist.splice(index, 1);
                count++;
            }
        });

        if (count > 0) {
            await chrome.storage.sync.set({ blacklist });
            _blacklistCache = blacklist;
        }

        return count;
    },

    // Check if URL is in blacklist
    check: async function (url) {
        if (!url) return false;

        if (this.isBuiltinPage(url)) {
            return true;
        }

        try {
            // Try to extract hostname
            const hostname = new URL(url).hostname;
            if (!hostname) return false;

            const blacklist = await this.getAll();
            if (!Array.isArray(blacklist) || blacklist.length === 0) {
                return false;
            }

            // Check if matches any blacklist item
            return blacklist.some(pattern => hostname.includes(pattern));
        } catch (e) {
            console.error("Error checking URL against blacklist:", e);
            return false;
        }
    },

    // Set blacklist
    set: async function (blacklist) {
        await chrome.storage.sync.set({ blacklist: blacklist });
        _blacklistCache = blacklist;
        return true;
    }
};

// 注册 storage.onChanged 监听器：外部变更时使缓存失效。
// 守卫判断用于兼容测试环境（Bun 中可能缺少该 API）。
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(_onChangedHandler);
}

// Common export pattern, supporting both CommonJS and browser environments
if (typeof module !== 'undefined' && module.exports) {
    // In Node.js/Bun environment
    module.exports = { BlackList, _onChangedHandler };
}
