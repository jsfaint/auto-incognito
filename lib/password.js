const getPassword = async () => {
    const data = await chrome.storage.sync.get('password');

    return data.password || '';
};

const setPassword = async (newPassword) => await chrome.storage.sync.set({ password: newPassword });

const getPasswordOption = async () => {
    const data = await chrome.storage.sync.get(['passwordOption']);

    return data.passwordOption;
};

const setPasswordOption = async (passwordOption) => await chrome.storage.sync.set({ passwordOption: passwordOption });

// 通用导出模式，同时支持CommonJS和浏览器环境
if (typeof module !== 'undefined' && module.exports) {
    // 在Node.js/Bun环境中
    module.exports = {
        getPassword,
        setPassword,
        getPasswordOption,
        setPasswordOption
    };
}
