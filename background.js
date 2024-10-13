try {
    importScripts('lib/blacklist.js');
} catch (e) {
    console.error(e);
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    try {
        const tab = await chrome.tabs.get(details.tabId);
        if (chrome.runtime.lastError) {
            return; // 如果获取标签信息失败，直接返回
        }

        if (tab === undefined || tab.incognito) {
            return;
        }

        const url = details.url;

        const blacklist = await getBlacklist();

        let found = findInList(url, blacklist);
        if (found) {
            // 创建一个新的隐私窗口
            await chrome.windows.create({
                url: url,
                incognito: true
            });

            // 关闭当前标签页
            await chrome.tabs.remove(details.tabId);
            // 从历史记录中删除该网址
            await chrome.history.deleteUrl({ url: url });
        }
    } catch (error) {
        console.error('auto incognito: ', error);
    }
}, { url: [{ urlMatches: '.*' }] });
