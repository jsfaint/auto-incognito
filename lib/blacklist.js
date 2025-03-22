const BlackList = {
    // 获取所有黑名单项
    getAll: async function () {
        return new Promise((resolve) => {
            chrome.storage.local.get(['blacklist'], function (result) {
                resolve(result.blacklist || []);
            });
        });
    },

    // 添加项目到黑名单
    add: async function (url) {
        return new Promise((resolve) => {
            this.getAll().then(blacklist => {
                if (!Array.isArray(blacklist)) {
                    blacklist = [];
                }

                if (!blacklist.includes(url)) {
                    blacklist.push(url);
                    chrome.storage.local.set({ blacklist: blacklist }, function () {
                        resolve(true);
                    });
                } else {
                    resolve(false);
                }
            });
        });
    },

    // 从黑名单中移除项目
    remove: async function (url) {
        return new Promise((resolve) => {
            this.getAll().then(blacklist => {
                if (!Array.isArray(blacklist)) {
                    blacklist = [];
                    resolve(false);
                    return;
                }

                const index = blacklist.indexOf(url);
                if (index !== -1) {
                    blacklist.splice(index, 1);
                    chrome.storage.local.set({ blacklist: blacklist }, function () {
                        resolve(true);
                    });
                } else {
                    resolve(false);
                }
            });
        });
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
            chrome.storage.local.set({ blacklist: blacklist }, function () {
                resolve(true);
            });
        });
    }
};