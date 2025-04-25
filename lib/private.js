const getPrivateOption = async () => {
    const data = await chrome.storage.sync.get(['private']);

    return data.private;
};

const setPrivateOption = async (privateOption) => await chrome.storage.sync.set({ private: privateOption });


const getWindowState = async () => {
    const data = await chrome.storage.sync.get(['windowState']);
    return data.windowState;
};

const setWindowState = async (state) => {
    await chrome.storage.sync.set({ windowState: state });
};

// Common export pattern, supporting both CommonJS and browser environments
if (typeof module !== 'undefined' && module.exports) {
    // In Node.js/Bun environment
    module.exports = {
        getPrivateOption,
        setPrivateOption,
        getWindowState,
        setWindowState,
    };
}


