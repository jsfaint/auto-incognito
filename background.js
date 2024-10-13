"use strict";

try {
    importScripts('lib/blacklist.js', 'lib/whitelist.js', 'lib/private.js');
} catch (e) {
    console.error(e);
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // 如果private mode未打开，则不需要在此listener中处理
    const privateOption = await getPrivateOption();
    if (!privateOption) {
        return;
    }

    const tab = await chrome.tabs.get(details.tabId);
    if (tab === undefined || tab.incognito) {
        return;
    }

    const url = details.url;

    // 如果地址在白名单中，则跳过
    if (findInWhitelist(url)) {
        return;
    }

    const found = findInBlacklist(url);
    if (!found) {
        return;
    }

    // 创建一个新的隐私窗口
    chrome.windows.create({
        url: url,
        incognito: true
    });

    // 关闭当前标签页
    chrome.tabs.remove(details.tabId);
    // 从历史记录中删除该网址
    chrome.history.deleteUrl({ url: url });
}, { url: [{ urlMatches: '.*' }] });

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
        const privateOption = await getPrivateOption();
        // 如果private mode已打开，则不需要在此listener中处理
        if (privateOption) {
            return;
        }

        const found = findInBlacklist(tab.url);
        if (!found) {
            return;
        }

        // 清除该标签页的访问历史
        chrome.history.deleteUrl({ url: tab.url });
    });
});
