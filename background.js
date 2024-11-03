"use strict";

try {
    importScripts('lib/blacklist.js', 'lib/private.js');
} catch (e) {
    console.error(e);
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
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
}, { url: [{ urlMatches: '.*' }] });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const removeHistory = async () => {
        const privateOption = await getPrivateOption();
        // If the private option was enabled, skip it.
        if (privateOption) {
            return;
        }

        const found = await findInBlacklist(tab.url);
        if (!found) {
            return;
        }

        // Clear url history of curr
        await chrome.history.deleteUrl({ url: tab.url });
    };

    chrome.tabs.onRemoved.addListener(removeHistory);

    chrome.tabs.onReplaced.addListener(removeHistory);
});
