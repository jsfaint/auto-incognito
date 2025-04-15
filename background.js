"use strict";

try {
    importScripts('lib/blacklist.js', 'lib/private.js', 'lib/whitelist.js', 'lib/password.js');
} catch (e) {
    console.log("Error importing scripts:", e);
}

// 保持service worker活跃的心跳
const keepAlive = () => {
    const keepAliveInterval = 20; // 20秒间隔
    chrome.alarms.create('keepAlive', {
        periodInMinutes: keepAliveInterval / 60
    });
};

// 监听alarm事件
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
        console.log('keepAlive', alarm);
    }
});

keepAlive();

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

        const state = await getWindowState();
        const windows = await chrome.windows.getAll();
        const incognitoWindow = windows.find(window => window.incognito);

        console.log("windows:", windows);
        console.log("incognitoWindow:", incognitoWindow);

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

chrome.tabs.onUpdated.addListener(normalModeHandler);
