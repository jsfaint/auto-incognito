document.addEventListener('DOMContentLoaded', async () => {
    // 点击添加黑名单
    document.getElementById('addCurrentTabButton').addEventListener('click', async () => {
        // 获取当前活动的标签页
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
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
        const blacklist = await getBlacklist();

        if (!findInList(primaryDomain, blacklist)) { // 检查是否已存在
            blacklist.push(primaryDomain);
            await setBlacklist(blacklist);
            displayBlacklist();

            chrome.tabs.reload(tabs[0].id)
        }
    });

    // 现有的添加网址到黑名单的代码...
    document.getElementById('addButton').addEventListener('click', async () => {
        const urlInput = document.getElementById('urlInput').value.trim();
        if (!urlInput) {
            return;
        }

        const blacklist = await getBlacklist();
        if (!findInList(urlInput, blacklist)) {
            blacklist.push(urlInput);
            await setBlacklist(blacklist);
            displayBlacklist();
        }
    });

    // 显示黑名单
    async function displayBlacklist() {
        const blacklist = await getBlacklist();
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
    }

    const passwordForm = document.getElementById('password-form');
    const verifyPasswordForm = document.getElementById('verify-password-form');
    const blacklistDiv = document.getElementById('blacklist-manager');

    // 检查是否已经设置了密码
    const password = await getPassword();
    if (password) {
        // 如果已经设置了密码，显示验证密码的表单
        verifyPasswordForm.removeAttribute('hidden');
        document.getElementById('verify-password').focus();
    } else {
        // 如果没有设置密码，显示设置密码的表单
        passwordForm.removeAttribute('hidden');
        document.getElementById('new-password').focus();
    }

    const newPassword = document.getElementById('new-password').value;
    if (newPassword) {
        await setPassword(newPassword);
        verifyPasswordForm.removeAttribute('hidden', '');
        passwordForm.setAttribute('hidden', '');

        alert('设置密码成功');
    }

    // 设置密码
    document.getElementById('set-password').addEventListener('click', async () => {
        await setPassword();
    });

    // 设置密码 监听回车键事件
    document.getElementById('new-password').addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            await setPassword();
        }
    });

    async function verifyPassword() {
        const enteredPassword = document.getElementById('verify-password').value;

        const password = await getPassword();
        if (enteredPassword === password) {
            verifyPasswordForm.setAttribute('hidden', '');
            passwordForm.setAttribute('hidden', '');

            blacklistDiv.removeAttribute('hidden');

            // 将光标聚焦在输入框上
            document.getElementById('urlInput').focus();
        } else {
            alert('密码错误');
        }
    }

    // 验证密码
    document.getElementById('verify-password-btn').addEventListener('click', () => {
        verifyPassword();
    });

    // 验证密码 监听回车键事件
    document.getElementById('verify-password').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            verifyPassword();
        }
    });

    // 初始显示黑名单
    displayBlacklist();
});

