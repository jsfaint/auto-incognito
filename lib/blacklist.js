const getBlacklist = async () => {
    const result = await chrome.storage.sync.get(['blacklist']);

    return result.blacklist || [];
}

const findInList = (url, list) => list.some(item => url.includes(item));

const findInBlacklist = async (url) => {
    const blacklist = await getBlacklist();

    return findInList(url, blacklist);
}

const addToBlacklist = async (url) => {
    const blacklist = await getBlacklist();

    return blacklist.some(item => url.includes(item));
}

const removeFromBlacklist = async (url) => {
    const blacklist = await getBlacklist();
    blacklist = blacklist.filter(item => item !== url);
    chrome.storage.sync.set({ blacklist }, displayBlacklist);
}

const setBlacklist = async (blacklist) => await chrome.storage.sync.set({ blacklist: blacklist });
