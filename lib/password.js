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
