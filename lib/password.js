async function getPassword() {
    const data = await chrome.storage.sync.get('password');

    return data.password || '';
}


async function setPassword(newPassword) {
    await chrome.storage.sync.set({ password: newPassword });
}
