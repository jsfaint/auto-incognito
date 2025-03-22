"use strict";

try {
    importScripts('lib/blacklist.js', 'lib/private.js', 'lib/whitelist.js', 'lib/password.js');
} catch (e) {
    console.log("Error importing scripts:", e);
}

// 查找URL是否在黑名单中
async function findInBlacklist(url) {
    if (url == undefined || url == '' || findInWhitelist(url)) {
        return false;
    }

    try {
        const hostname = new URL(url).hostname;
        const blacklist = await getBlacklist();

        return blacklist.some(pattern => hostname.includes(pattern));
    } catch (e) {
        console.log("Error checking blacklist:", e);
        return false;
    }
}

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
        const found = await findInBlacklist(url);
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

chrome.webNavigation.onBeforeNavigate.addListener(privateModeHandler);

const normalModeHandler = async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.url === undefined) {
            return;
        }

        const url = changeInfo.url;
        const found = await findInBlacklist(url);
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

chrome.tabs.onUpdated.addListener(normalModeHandler);

const getWindowState = async () => {
    const data = await chrome.storage.sync.get(['windowState']);
    return data.windowState;
};

