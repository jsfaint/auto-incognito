"use strict";

try {
    importScripts('lib/blacklist.js', 'lib/private.js', 'lib/whitelist.js', 'lib/password.js');
} catch (e) {
    console.log("Error importing scripts:", e);
}

const privateModeHandler = async (tabId, url) => {
    try {
        // if private option was disabled, skip it.
        const privateOption = await getPrivateOption();
        if (!privateOption) {
            return;
        }

        const tab = await chrome.tabs.get(tabId);
        if (tab === undefined || tab.incognito) {
            return;
        }

        const found = await BlackList.check(url);
        if (!found) {
            return;
        }

        // Check if it's a builtin page, if so, don't open in private mode
        if (BlackList.isBuiltinPage(url)) {
            return;
        }

        const state = await getWindowState();
        const windows = await chrome.windows.getAll();
        const incognitoWindow = windows.find(window => window.incognito);

        if (state === 'tabbed') {
            if (incognitoWindow !== undefined && state === 'tabbed') {
                await chrome.tabs.create({
                    url: url,
                    windowId: incognitoWindow.id
                });
            } else {
                await chrome.windows.create({
                    url: url,
                    incognito: true,
                    state: 'maximized'
                });
            }
        } else {
            await chrome.windows.create({
                url: url,
                incognito: true,
                state: await getWindowState() || 'maximized'
            });
        }

        // Close current tab
        await chrome.tabs.remove(tabId);
    } catch (e) {
        console.log("privateModeHandler: ", e);
    }
};

const historyHandler = async (details) => {
    try {
        const url = details.url;
        const found = await BlackList.check(url);
        if (!found) {
            return;
        }

        await chrome.history.deleteUrl({ url: url });
        console.log('deleteUrl', url);
    } catch (e) {
        console.log("historyHandler: ", e);
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!changeInfo.url) return;
    privateModeHandler(tabId, changeInfo.url);
});

chrome.history.onVisited.addListener(historyHandler);
