"use strict";

try {
    importScripts('lib/blacklist.js', 'lib/private.js');
} catch (e) {
    console.error(e);
}

const privateModeHandler = async (details) => {
    // if private option was disabled, skip it.
    const privateOption = await getPrivateOption();
    if (!privateOption) {
        return;
    }

    const tab = await chrome.tabs.get(details.tabId);
    if (tab === undefined || tab.incognito) {
        return;
    }

    const url = details.url;

    const found = await findInBlacklist(url);
    if (!found) {
        return;
    }

    // Create a new private window
    await chrome.windows.create({
        url: url,
        incognito: true
    });

    // Close current tab
    await chrome.tabs.remove(details.tabId);
    // Clear url history
    await chrome.history.deleteUrl({ url: url });
};

chrome.webNavigation.onBeforeNavigate.addListener(privateModeHandler);

// Clear url history
const removeHistory = async (url) => {
    try {
        const privateOption = await getPrivateOption();
        // If the private option was enabled, skip it.
        if (privateOption) {
            return;
        }

        const found = await findInBlacklist(url);
        if (!found) {
            return;
        }

        // Clear url history of curr
        await chrome.history.deleteUrl({ url: url });
        console.log("History removed: ", url);
    } catch (e) {
        console.log("removeHistory: ", e);
    }
};

const normalModeHandler = async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.url === undefined) {
            return;
        }

        const url = changeInfo.url;
        chrome.tabs.onRemoved.addListener(async (removedTabId) => {
            if (removedTabId === tabId) {
                await removeHistory(url);
            }
        });
    } catch (e) {
        console.error("Error in tab update handler:", e);
    }
};

chrome.tabs.onUpdated.addListener(normalModeHandler);
