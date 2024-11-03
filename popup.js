"use strict";

document.addEventListener('DOMContentLoaded', async () => {
    (() => {
        //Localize by replacing __MSG_***__ meta tags
        var objects = document.getElementsByTagName('html');
        for (var j = 0; j < objects.length; j++) {
            var obj = objects[j];

            var valStrH = obj.innerHTML.toString();
            var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function (match, v1) {
                return v1 ? chrome.i18n.getMessage(v1) : "";
            });

            if (valNewH != valStrH) {
                obj.innerHTML = valNewH;
            }
        }
    })();

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

    const displayBlacklist = async () => {
        const blacklist = await getBlacklist();
        const blacklistElement = document.getElementById('blacklist');

        blacklistElement.innerHTML = '';
        blacklist.forEach(url => {
            const li = document.createElement('li');
            li.textContent = url;
            li.addEventListener('click', async () => {
                await removeFromBlacklist(url);
                displayBlacklist();
            });
            blacklistElement.appendChild(li);
        });
    };

    const verifyPassword = async () => {
        const enteredPassword = verifyInput.value;

        const password = await getPassword();
        if (enteredPassword === password) {
            verifyPasswordForm.setAttribute('hidden', '');
            passwordForm.setAttribute('hidden', '');

            blacklistDiv.removeAttribute('hidden');

            urlInput.focus();
        } else {
            // empty password input
            verifyPasswordForm.value = "";
            alert(chrome.i18n.getMessage("info_verify_password"));
        }
    };

    const addInputBlackList = async () => {
        const url = urlInput.value.trim();
        if (!url) {
            return;
        }

        if (await addToBlacklist(url)) {
            // empty blacklist input
            urlInput.value = "";
            displayBlacklist();
        }
    };

    // check if private option was set
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

    addCurrentTabButton.addEventListener('click', async () => {
        // Get the currently active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length <= 0) {
            return;
        }

        const url = tabs[0].url; // get url of current tab
        const hostname = new URL(url).hostname; // extract the domain url

        if (findInWhitelist(url)) {
            return;
        }

        const parts = hostname.split('.');
        const tld = parts.pop();
        const secondLevelDomain = parts.pop();
        const primaryDomain = `${secondLevelDomain}.${tld}`;

        const blacklist = await getBlacklist();

        if (await addToBlacklist(primaryDomain)) {
            displayBlacklist();
            chrome.tabs.reload(tabs[0].id);
        }
    });

    urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addInputBlackList();
        }
    });

    addButton.addEventListener('click', async () => {
        addInputBlackList();
    });

    // Check if the password was set
    const password = await getPassword();
    if (password) {
        // verify password
        verifyPasswordForm.removeAttribute('hidden');
        verifyInput.focus();
    } else {
        // set password
        passwordForm.removeAttribute('hidden');
        newPasswordInput.focus();
    }

    setPasswordButton.addEventListener('click', async () => {
        const newPassword = newPasswordInput.value;
        if (newPassword) {
            await setPassword(newPassword);
            verifyPasswordForm.removeAttribute('hidden', '');
            passwordForm.setAttribute('hidden', '');

            alert(chrome.i18n.getMessage("info_set_password_success"));
        } else {
            alert(chrome.i18n.getMessage("info_set_password_hint"));
        }
    });

    verifyButton.addEventListener('click', () => {
        verifyPassword();
    });

    verifyInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            verifyPassword();
        }
    });

    displayBlacklist();
});

