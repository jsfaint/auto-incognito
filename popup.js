"use strict";

document.addEventListener('DOMContentLoaded', async () => {
    const passwordForm = document.getElementById('password-form');
    const setPasswordButton = document.getElementById('set-password');
    const verifyPasswordForm = document.getElementById('verify-password-form');
    const blacklistDiv = document.getElementById('blacklist-manager');

    const privateMode = document.getElementById('in-private-mode');

    const verifyInput = document.getElementById('verify-password');
    const verifyButton = document.getElementById('verify-password-btn');

    const newPasswordInput = document.getElementById('new-password');

    const addCurrentTabButton = document.getElementById('addCurrentTabButton');
    const addButton = document.getElementById('addButton');
    const urlInput = document.getElementById('urlInput');

    // 显示黑名单
    const displayBlacklist = async () => {
        const blacklist = await getBlacklist();
        const blacklistElement = document.getElementById('blacklist');

        blacklistElement.innerHTML = '';
        blacklist.forEach(url => {
            const li = document.createElement('li');
            li.textContent = url;
            li.addEventListener('click', () => {
                removeFromBlacklist(url);
            });
            blacklistElement.appendChild(li);
        });
    }

    // 验证密码
    const verifyPassword = async () => {
        const enteredPassword = verifyInput.value;

        const password = await getPassword();
        if (enteredPassword === password) {
            verifyPasswordForm.setAttribute('hidden', '');
            passwordForm.setAttribute('hidden', '');

            blacklistDiv.removeAttribute('hidden');

            // 将光标聚焦在输入框上
            urlInput.focus();
        } else {
            alert('密码错误');
        }
    }

    const addInputBlackList = async () => {
        const url = urlInput.value.trim();
        if (!url) {
            return;
        }

        const blacklist = await getBlacklist();
        if (!findInList(url, blacklist)) {
            blacklist.push(url);
            await setBlacklist(blacklist);
            displayBlacklist();
        }
    }

    // 检查private mode是否开启
    const privateOption = await getPrivateOption();

    if (privateOption === undefined) {
        privateMode.checked = true;
        await setPrivateOption(true);
    } else {
        privateMode.checked = privateOption;
    }

    privateMode.addEventListener('change', async () => {
        await setPrivateOption(privateMode.checked);
    });

    // 点击添加黑名单
    addCurrentTabButton.addEventListener('click', async () => {
        // 获取当前活动的标签页
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length <= 0) {
            return;
        }

        const url = tabs[0].url; // 获取当前标签的 URL
        const hostname = new URL(url).hostname; // 提取域名

        if (findInWhitelist(url)) {
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

    urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addInputBlackList();
        }
    });

    // 现有的添加网址到黑名单的代码...
    addButton.addEventListener('click', async () => {
        addInputBlackList();
    });

    // 检查是否已经设置了密码
    const password = await getPassword();
    if (password) {
        // 如果已经设置了密码，显示验证密码的表单
        verifyPasswordForm.removeAttribute('hidden');
        verifyInput.focus();
    } else {
        // 如果没有设置密码，显示设置密码的表单
        passwordForm.removeAttribute('hidden');
        newPasswordInput.focus();
    }

    // 设置密码
    setPasswordButton.addEventListener('click', async () => {
        const newPassword = newPasswordInput.value;
        if (newPassword) {
            await setPassword(newPassword);
            verifyPasswordForm.removeAttribute('hidden', '');
            passwordForm.setAttribute('hidden', '');

            alert('设置密码成功');
        } else {
            alert('请输入密码！');
        }
    });

    // 验证密码
    verifyButton.addEventListener('click', () => {
        verifyPassword();
    });

    // 验证密码 监听回车键事件
    verifyInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            verifyPassword();
        }
    });

    // 初始显示黑名单
    displayBlacklist();
});

