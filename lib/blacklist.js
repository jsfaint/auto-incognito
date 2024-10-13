async function getBlacklist() {
    const result = await chrome.storage.sync.get(['blacklist']);

    return result.blacklist || [];
}

function findInList(url, list) {
    for (let item of list) {
        if (url.includes(item)) {
            return true;
        }

        break;
    }

    return false;
}

async function findInBlacklist(url) {
    const blacklist = await getBlacklist();

    for (let item of blacklist) {
        if (url.includes(item)) {
            return true;
        }

        break;
    }

    return false;
}

async function removeFromBlacklist(url) {
    const blacklist = await getBlacklist();
    blacklist = blacklist.filter(item => item !== url);
    chrome.storage.sync.set({ blacklist }, displayBlacklist);
}

async function setBlacklist(blacklist) {
    await chrome.storage.sync.set({ blacklist: blacklist });
}
