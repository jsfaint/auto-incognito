const getPrivateOption = async () => {
    const data = await chrome.storage.sync.get(['private']);

    return data.private;
};

const setPrivateOption = async (privateOption) => await chrome.storage.sync.set({ private: privateOption });
