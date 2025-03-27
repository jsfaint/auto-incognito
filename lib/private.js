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

// 通用导出模式，同时支持CommonJS和浏览器环境
if (typeof module !== 'undefined' && module.exports) {
    // 在Node.js/Bun环境中
    module.exports = {
        getPrivateOption,
        setPrivateOption,
        getWindowState,
        setWindowState,
    };
}


