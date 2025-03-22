// 密码功能的模拟实现
const getPassword = async () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get('password', function (data) {
            resolve(data.password || '');
        });
    });
};

const setPassword = async (newPassword) => {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ password: newPassword }, function () {
            resolve();
        });
    });
};

const getPasswordOption = async () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['passwordOption'], function (data) {
            resolve(data.passwordOption);
        });
    });
};

const setPasswordOption = async (passwordOption) => {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ passwordOption: passwordOption }, function () {
            resolve();
        });
    });
};

module.exports = { getPassword, setPassword, getPasswordOption, setPasswordOption }; 