const BlackList = {
    // 获取所有黑名单项
    getAll: async function () {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['blacklist'], function (result) {
                resolve(result.blacklist || []);
            });
        });
    },

    // 添加项目到黑名单
    add: async function (url) {
        const blacklist = await this.getAll();

        // 如果已存在，直接返回
        if (blacklist.includes(url)) {
            return false;
        }

        // 添加新项并保存
        blacklist.push(url);
        return new Promise((resolve) => {
            chrome.storage.sync.set({ blacklist }, () => resolve(true));
        });
    },

    // 从黑名单中移除项目
    remove: async function (url) {
        const blacklist = await this.getAll();
        const index = blacklist.indexOf(url);

        // 如果不存在，直接返回
        if (index === -1) {
            return false;
        }

        // 移除项并保存
        blacklist.splice(index, 1);
        return new Promise((resolve) => {
            chrome.storage.sync.set({ blacklist }, () => resolve(true));
        });
    },

    // 批量删除黑名单项
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
            await new Promise((resolve) => {
                chrome.storage.sync.set({ blacklist }, () => resolve());
            });
        }

        return count;
    },

    // 检查URL是否在黑名单中
    check: async function (url) {
        if (!url) return false;

        try {
            // 尝试提取主机名
            const hostname = new URL(url).hostname;
            if (!hostname) return false;

            const blacklist = await this.getAll();
            if (!Array.isArray(blacklist) || blacklist.length === 0) {
                return false;
            }

            // 检查是否匹配任何黑名单项
            return blacklist.some(pattern => hostname.includes(pattern));
        } catch (e) {
            console.error("Error checking URL against blacklist:", e);
            return false;
        }
    },

    // 设置黑名单
    set: async function (blacklist) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ blacklist: blacklist }, function () {
                resolve(true);
            });
        });
    }
};

// 通用导出模式，同时支持CommonJS和浏览器环境
if (typeof module !== 'undefined' && module.exports) {
    // 在Node.js/Bun环境中
    module.exports = { BlackList };
}