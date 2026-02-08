"use strict";

document.addEventListener('DOMContentLoaded', async () => {
    localizeHtmlPage();

    const chkPasswordOption = document.getElementById('password-option');

    const formPassword = document.getElementById('password-form');
    const btnSetPassword = document.getElementById('set-password');
    const formVerifyPassword = document.getElementById('verify-password-form');

    const chkPrivate = document.getElementById('in-private-mode');

    const inputVerify = document.getElementById('verify-password');
    const btnVerify = document.getElementById('verify-password-btn');

    const inputNewPassword = document.getElementById('new-password');

    const btnAddCurrentTab = document.getElementById('addCurrentTabButton');
    const btnAdd = document.getElementById('addButton');
    const InputURL = document.getElementById('urlInput');

    const formSetting = document.getElementById('setting-form');
    const btnClearPassword = document.getElementById('clear-password');

    const btnExport = document.getElementById('exportButton');
    const btnImport = document.getElementById('importButton');

    const btnImportBookmark = document.getElementById('importBookmarkButton');
    const btnManageBlacklist = document.getElementById('manageBlacklistButton');

    const verifyPassword = async () => {
        const enteredPassword = inputVerify.value;

        const password = await getPassword();
        if (enteredPassword === password) {
            formVerifyPassword.setAttribute('hidden', '');
            formPassword.setAttribute('hidden', '');

            formSetting.removeAttribute("hidden");

            InputURL.focus();
        } else {
            // empty password input
            formVerifyPassword.value = "";
            alert(chrome.i18n.getMessage("info_verify_password"));
        }
    };

    const addInputBlackList = async () => {
        const url = InputURL.value.trim();
        if (!url) {
            return;
        }

        if (await BlackList.add(url)) {
            // empty blacklist input
            InputURL.value = "";
            showStatusMessage(chrome.i18n.getMessage("msg_add_success") || '添加成功');
        } else {
            showStatusMessage(chrome.i18n.getMessage("msg_already_exists") || '网址已存在', 'error');
        }
    };

    // Initial Option
    const OptionInit = async () => {
        // Initial privateOption
        const privateOption = await getPrivateOption();
        if (privateOption === undefined) {
            chkPrivate.checked = true;
            setPrivateOption(true);
        } else {
            chkPrivate.checked = privateOption;
        }

        // Initial passwordOption
        const passwordOptionValue = await getPasswordOption();
        if (passwordOptionValue === undefined) {
            const passwordValue = await getPassword();

            if (passwordValue) {
                chkPasswordOption.checked = true;
            } else {
                chkPasswordOption.checked = false;
            }

            setPasswordOption(chkPasswordOption.checked)
        } else {
            chkPasswordOption.checked = passwordOptionValue;
        }

        const windowStateSelect = document.getElementById('window-state');

        // Initialize window state
        const windowState = await getWindowState();
        windowStateSelect.value = windowState || 'maximized';

        // Add event listener
        windowStateSelect.addEventListener('change', async () => {
            await setWindowState(windowStateSelect.value);
        });
    };

    btnAddCurrentTab.addEventListener('click', async () => {
        // Get the currently active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length <= 0) {
            return;
        }

        const url = tabs[0].url; // get url of current tab

        if (findInWhitelist(url)) {
            return;
        }

        const primaryDomain = extractPrimaryDomain(url);
        if (primaryDomain && await BlackList.add(primaryDomain)) {
            chrome.tabs.reload(tabs[0].id);
        }
    });

    chkPrivate.addEventListener('change', async () => {
        await setPrivateOption(chkPrivate.checked);
    });

    InputURL.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addInputBlackList();
        }
    });

    btnAdd.addEventListener('click', async () => {
        addInputBlackList();
    });

    btnSetPassword.addEventListener('click', async () => {
        const newPassword = inputNewPassword.value;
        if (newPassword) {
            await setPassword(newPassword);
            formVerifyPassword.removeAttribute('hidden', '');
            formPassword.setAttribute('hidden', '');

            alert(chrome.i18n.getMessage("info_set_password_success"));
        } else {
            alert(chrome.i18n.getMessage("info_set_password_hint"));
        }
    });

    btnVerify.addEventListener('click', () => {
        verifyPassword();
    });

    inputVerify.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            verifyPassword();
        }
    });

    chkPasswordOption.addEventListener("change", async () => {
        await setPasswordOption(chkPasswordOption.checked);
        window.location.reload();
    });

    // Clear password
    btnClearPassword.addEventListener("click", async () => {
        await setPassword("");
        alert(chrome.i18n.getMessage("info_clear_password"));
    });

    const exportBlacklist = async () => {
        const blacklist = await BlackList.getAll();
        const blob = new Blob([blacklist.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'blacklist.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    btnExport.addEventListener("click", exportBlacklist);

    const importBlacklist = async (file) => {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const whitelistFiltered = lines.filter(url => !findInWhitelist(url));

        const currentBlacklist = await BlackList.getAll();
        const newBlacklist = [...new Set([...currentBlacklist, ...whitelistFiltered])];

        await BlackList.set(newBlacklist);
        alert(chrome.i18n.getMessage("alert_import_success", [whitelistFiltered.length]));
    };

    btnImport.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file?.type === 'text/plain') {
                importBlacklist(file);
            } else {
                alert(chrome.i18n.getMessage("alert_invalid_file"));
            }
        };
        input.click();
    });

    // Import URLs from bookmarks to blacklist
    const importFromBookmarks = async (selectedNodes) => {
        let count = 0;
        const currentBlacklist = await BlackList.getAll();
        const newUrls = [];

        // Recursively process bookmark folders
        const processNode = (node) => {
            if (node.url) {
                // Skip URLs in whitelist
                if (findInWhitelist(node.url)) {
                    return;
                }

                // Extract primary domain
                const primaryDomain = extractPrimaryDomain(node.url);

                // Only add URLs not in current blacklist
                if (primaryDomain && !currentBlacklist.includes(primaryDomain) && !newUrls.includes(primaryDomain)) {
                    newUrls.push(primaryDomain);
                    count++;
                }
            }

            // Recursively process subfolders
            if (node.children) {
                node.children.forEach(processNode);
            }
        };

        // Process selected nodes
        processNode(selectedNodes);

        // If new URLs found, add to blacklist
        if (newUrls.length > 0) {
            const newBlacklist = [...currentBlacklist, ...newUrls];
            await BlackList.set(newBlacklist);
            alert(chrome.i18n.getMessage("alert_import_bookmark_success", [count]));
        } else {
            alert(chrome.i18n.getMessage("alert_no_new_records"));
        }
    };

    btnImportBookmark.addEventListener('click', () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('bookmark.html')
        });
    });

    // Start from here
    await OptionInit();

    const passwordValue = await getPassword();
    const passwordOptionValue = await getPasswordOption();

    if (passwordOptionValue) {
        if (passwordValue.length == 0) {
            // Set password
            formPassword.removeAttribute("hidden");
            inputNewPassword.focus();
        } else {
            formVerifyPassword.removeAttribute("hidden");
            inputVerify.focus();
        }
    } else {
        formSetting.removeAttribute("hidden");
    }

    // Add blacklist management button event
    if (btnManageBlacklist) {
        btnManageBlacklist.addEventListener('click', () => {
            chrome.tabs.create({ url: 'blacklist-manager.html' });
        });
    }
});
