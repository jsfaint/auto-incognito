const getBlacklist = async () => {
    const result = await chrome.storage.sync.get(['blacklist']);

    return result.blacklist || [];
};

const findInBlacklist = async (url) => {
    const blacklist = await getBlacklist();
    const urlObj = new URL(url);
    return blacklist.some(item => {
        try {
            const itemObj = new URL(item);
            return urlObj.hostname === itemObj.hostname;
        } catch {
            return url.includes(item);
        }
    });
    return blacklist.some(item => url.includes(item));
};

const addToBlacklist = async (url) => {
    const blacklist = await getBlacklist();

    if (blacklist.some(item => url.includes(item))) {
        return false;
    }

    blacklist.push(url);

    await setBlacklist(blacklist);

    return true;
};

const removeFromBlacklist = async (url) => {
    let blacklist = await getBlacklist();
    blacklist = blacklist.filter(item => item !== url);
    await setBlacklist(blacklist);
};

const setBlacklist = async (blacklist) => await chrome.storage.sync.set({ blacklist: blacklist });
