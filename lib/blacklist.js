async function getBlacklist() {
    const result = await chrome.storage.sync.get(['blacklist']);

    return result.blacklist || [];
}

function findInList(url, list) {
    return list.some(item => url.includes(item));
}

async function findInBlacklist(url) {
    const blacklist = await getBlacklist();

    return blacklist.some(item => url.includes(item));
}

async function removeFromBlacklist(url) {
    const blacklist = await getBlacklist();
    blacklist = blacklist.filter(item => item !== url);
    chrome.storage.sync.set({ blacklist }, displayBlacklist);
}

async function setBlacklist(blacklist) {
    await chrome.storage.sync.set({ blacklist: blacklist });
}
