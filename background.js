chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
    // 首先，查询当前活动标签的信息
    chrome.tabs.get(details.tabId, function (tab) {
        if (tab.incognito) {
            return; // 跳过隐私标签页
        }

        chrome.storage.sync.get(['blacklist'], function (result) {
            const blacklist = result.blacklist || [];
            const url = details.url;

            for (let blockedUrl of blacklist) {
                if (url.includes(blockedUrl)) {
                    // 创建一个新的隐私窗口
                    chrome.windows.create({
                        url: url,
                        incognito: true
                    }, function () {
                        // 只关闭普通模式的标签页
                        if (!tab.incognito) { // 检查当前标签是否是隐私模式
                            chrome.tabs.remove(details.tabId);
                        }
                        // 从历史记录中删除该网址
                        chrome.history.deleteUrl({ url: url });
                    });
                    break; // 找到匹配后退出循环
                }
            }
        });
    });
}, { url: [{ urlMatches: '.*' }] });
