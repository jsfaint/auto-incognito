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
        return new Promise((resolve) => {
            this.getAll().then(blacklist => {
                if (!Array.isArray(blacklist)) {
                    resolve(false);
                    return;
                }

                for (const pattern of blacklist) {
                    if (url.includes(pattern)) {
                        resolve(true);
                        return;
                    }
                }
                resolve(false);
            });
        });
    },

    set: async function (blacklist) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ blacklist: blacklist }, function () {
                resolve(true);
            });
        });
    }
};