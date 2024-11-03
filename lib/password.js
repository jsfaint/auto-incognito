const getPassword = async () => {
    const data = await chrome.storage.sync.get('password');

    return data.password || '';
};

const setPassword = async (newPassword) => await chrome.storage.sync.set({ password: newPassword });
