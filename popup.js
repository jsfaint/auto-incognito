"use strict";

document.addEventListener('DOMContentLoaded', async () => {
    localizeHtmlPage();

    // Password-related elements
    const chkPasswordOption = document.getElementById('password-option');
    const formPassword = document.getElementById('password-form');
    const formVerifyPassword = document.getElementById('verify-password-form');
    const inputNewPassword = document.getElementById('new-password');
    const inputVerify = document.getElementById('verify-password');
    const btnSetPassword = document.getElementById('set-password');
    const btnVerify = document.getElementById('verify-password-btn');
    const btnClearPassword = document.getElementById('clear-password');

    // Private mode elements
    const chkPrivate = document.getElementById('in-private-mode');
    const formSetting = document.getElementById('setting-form');

    // Blacklist management elements
    const InputURL = document.getElementById('urlInput');
    const btnAdd = document.getElementById('addButton');
    const btnAddCurrentTab = document.getElementById('addCurrentTabButton');
    const btnManageBlacklist = document.getElementById('manageBlacklistButton');

    // Import/Export elements
    const btnExport = document.getElementById('exportButton');
    const btnImport = document.getElementById('importButton');
    const btnImportBookmark = document.getElementById('importBookmarkButton');

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

    // Initial private mode option
    const initPrivateOption = async () => {
        const privateOption = await getPrivateOption();
        if (privateOption === undefined) {
            chkPrivate.checked = true;
            setPrivateOption(true);
        } else {
            chkPrivate.checked = privateOption;
        }
    };

    // Initial password option
    const initPasswordOption = async () => {
        const passwordOptionValue = await getPasswordOption();
        if (passwordOptionValue === undefined) {
            const passwordValue = await getPassword();
            chkPasswordOption.checked = !!passwordValue;
            setPasswordOption(chkPasswordOption.checked);
        } else {
            chkPasswordOption.checked = passwordOptionValue;
        }
    };

    // Initial window state
    const initWindowState = async () => {
        const windowStateSelect = document.getElementById('window-state');
        const windowState = await getWindowState();
        windowStateSelect.value = windowState || 'maximized';

        windowStateSelect.addEventListener('change', async () => {
            await setWindowState(windowStateSelect.value);
        });
    };

    // Initialize all options
    const OptionInit = async () => {
        await initPrivateOption();
        await initPasswordOption();
        await initWindowState();
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

    // Process bookmark node and collect domains
    const processBookmarkNode = (node, currentBlacklist, newUrls) => {
        if (node.url) {
            if (findInWhitelist(node.url)) {
                return;
            }

            const primaryDomain = extractPrimaryDomain(node.url);
            if (primaryDomain && !currentBlacklist.includes(primaryDomain) && !newUrls.includes(primaryDomain)) {
                newUrls.push(primaryDomain);
            }
        }

        if (node.children) {
            node.children.forEach(child => processBookmarkNode(child, currentBlacklist, newUrls));
        }
    };

    // Extract unique domains from bookmark nodes
    const extractDomainsFromBookmarks = (selectedNodes, currentBlacklist) => {
        const newUrls = [];
        selectedNodes.forEach(node => processBookmarkNode(node, currentBlacklist, newUrls));
        return newUrls;
    };

    // Import URLs from bookmarks to blacklist
    const importFromBookmarks = async (selectedNodes) => {
        const currentBlacklist = await BlackList.getAll();
        const newUrls = extractDomainsFromBookmarks(selectedNodes, currentBlacklist);

        if (newUrls.length > 0) {
            const newBlacklist = [...currentBlacklist, ...newUrls];
            await BlackList.set(newBlacklist);
            alert(chrome.i18n.getMessage("alert_import_bookmark_success", [newUrls.length]));
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
