async function getPrivateOption() {
    const data = await chrome.storage.sync.get(['private']);

    return data.private;
}

async function setPrivateOption(privateOption) {
    await chrome.storage.sync.set({ private: privateOption });
}
