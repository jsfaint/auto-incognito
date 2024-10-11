document.addEventListener('DOMContentLoaded', function () {
    function checkWhitelist(url) {
        const whitelist = new Set([
            "about:blank",
            "chrome://",
            "edge://",
        ]);

        for (const u of whitelist) {
            if (url.includes(u)) {
                return true;
            }
        }

        return false;
    }

    document.getElementById('addCurrentTabButton').addEventListener('click', function () {
        // 获取当前活动的标签页
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length <= 0) {
                return;
            }

            const url = tabs[0].url; // 获取当前标签的 URL
            const hostname = new URL(url).hostname; // 提取域名

            if (checkWhitelist(url)) {
                return;
            }

            // 提取一级域名
            const parts = hostname.split('.');
            const tld = parts.pop(); // 顶级域名
            const secondLevelDomain = parts.pop(); // 第二级域名
            const primaryDomain = secondLevelDomain + '.' + tld; // 组合成一级域名

            // 将一级域名添加到黑名单
            chrome.storage.sync.get(['blacklist'], function (result) {
                const blacklist = result.blacklist || [];
                if (!blacklist.includes(primaryDomain)) { // 检查是否已存在
                    blacklist.push(primaryDomain);
                    chrome.storage.sync.set({ blacklist }, displayBlacklist);

                    chrome.tabs.reload(tabs[0].id)
                }
            });
        });
    });

    // 现有的添加网址到黑名单的代码...
    document.getElementById('addButton').addEventListener('click', function () {
        const urlInput = document.getElementById('urlInput').value.trim();
        if (!urlInput) {
            return;
        }

        chrome.storage.sync.get(['blacklist'], function (result) {
            const blacklist = result.blacklist || [];
            if (!blacklist.includes(urlInput)) {
                blacklist.push(urlInput);
                chrome.storage.sync.set({ blacklist }, displayBlacklist);
            }
        });
    });

    // 显示黑名单
    function displayBlacklist() {
        chrome.storage.sync.get(['blacklist'], function (result) {
            const blacklist = result.blacklist || [];
            const blacklistElement = document.getElementById('blacklist');
            blacklistElement.innerHTML = '';
            blacklist.forEach(url => {
                const li = document.createElement('li');
                li.textContent = url;
                li.addEventListener('click', function () {
                    removeFromBlacklist(url);
                });
                blacklistElement.appendChild(li);
            });
        });
    }

    function removeFromBlacklist(url) {
        chrome.storage.sync.get(['blacklist'], function (result) {
            let blacklist = result.blacklist || [];
            blacklist = blacklist.filter(item => item !== url);
            chrome.storage.sync.set({ blacklist }, displayBlacklist);
        });
    }

    const passwordForm = document.getElementById('password-form');
    const verifyPasswordForm = document.getElementById('verify-password-form');
    const blacklist = document.getElementById('blacklist-manager');

    // 检查是否已经设置了密码
    chrome.storage.sync.get('password', function (data) {
        if (data.password) {
            // 如果已经设置了密码，显示验证密码的表单
            verifyPasswordForm.removeAttribute('hidden');
            document.getElementById('verify-password').focus();
        } else {
            // 如果没有设置密码，显示设置密码的表单
            passwordForm.removeAttribute('hidden');
            document.getElementById('new-password').focus();
        }
    });

    function setPassword() {
        const newPassword = document.getElementById('new-password').value;
        if (newPassword) {
            chrome.storage.sync.set({ password: newPassword }, function () {
                verifyPasswordForm.removeAttribute('hidden', '');
                passwordForm.setAttribute('hidden', '');

                alert('设置密码成功');
            });
        } else {
            alert('请输入密码');
        }
    }

    // 设置密码
    document.getElementById('set-password').addEventListener('click', function () {
        setPassword();
    });

    // 设置密码 监听回车键事件
    document.getElementById('new-password').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            setPassword();
        }
    });

    function verifyPassword() {
        const enteredPassword = document.getElementById('verify-password').value;

        chrome.storage.sync.get('password', function (data) {
            if (enteredPassword === data.password) {
                verifyPasswordForm.setAttribute('hidden', '');
                passwordForm.setAttribute('hidden', '');

                blacklist.removeAttribute('hidden');

                // 将光标聚焦在输入框上
                document.getElementById('urlInput').focus();
            } else {
                alert('密码错误');
            }
        });
    }

    // 验证密码
    document.getElementById('verify-password-btn').addEventListener('click', function () {
        verifyPassword();
    });

    // 验证密码 监听回车键事件
    document.getElementById('verify-password').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            verifyPassword();
        }
    });

    // 初始显示黑名单
    displayBlacklist();
});

