// 隐私模式功能的模拟实现
const getPrivateOption = async () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['private'], function (data) {
            resolve(data.private);
        });
    });
};

const setPrivateOption = async (privateOption) => {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ private: privateOption }, function () {
            resolve();
        });
    });
};

module.exports = { getPrivateOption, setPrivateOption };