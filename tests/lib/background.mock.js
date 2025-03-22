// 背景脚本功能的模拟实现
const privateModeHandler = async (details) => {
    try {
        const tab = await chrome.tabs.get(details.tabId);
        if (tab === undefined || tab.incognito) {
            return;
        }

        // if private option was disabled, skip it.
        const privateOption = await getPrivateOption();
        if (!privateOption) {
            return;
        }

        const url = details.url;
        const found = await BlackList.check(url);
        if (!found) {
            return;
        }

        // Close current tab
        await chrome.tabs.remove(details.tabId);

        // Create a new private window
        await chrome.windows.create({
            url: url,
            incognito: true,
            state: await getWindowState() || 'maximized'
        });
    } catch (e) {
        console.log("Error in tab update handler:", e);
    }
};

const normalModeHandler = async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.url === undefined) {
            return;
        }

        const url = changeInfo.url;
        const found = await BlackList.check(url);
        if (!found) {
            return;
        }

        const removeHistoryListener = async (removedTabId) => {
            if (removedTabId === tabId) {
                await chrome.history.deleteUrl({ url: url });
                chrome.tabs.onRemoved.removeListener(removeHistoryListener);
            }
        };

        chrome.tabs.onRemoved.addListener(removeHistoryListener);
    } catch (e) {
        console.log("Error in tab update handler:", e);
    }
};

const getWindowState = async () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['windowState'], function (data) {
            resolve(data.windowState);
        });
    });
};

module.exports = { privateModeHandler, normalModeHandler, getWindowState };