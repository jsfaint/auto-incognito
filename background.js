chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
    if (!details) {
        return;
    }

    // 首先，查询当前活动标签的信息
    chrome.tabs.get(details.tabId, function (tab) {
        if (chrome.runtime.lastError) {
            return; // 如果获取标签信息失败，直接返回
        }

        if (!tab || tab.incognito) {
            return;
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
                        // 关闭当前标签页
                        chrome.tabs.remove(details.tabId);
                        // 从历史记录中删除该网址
                        chrome.history.deleteUrl({ url: url });
                    });

                    break; // 找到匹配后退出循环
                }
            }
        });
    });
}, { url: [{ urlMatches: '.*' }] });
