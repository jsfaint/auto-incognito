"use strict";

const localizeHtmlPage = () => {
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
};

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

        if (await addToBlacklist(url)) {
            // empty blacklist input
            InputURL.value = "";
            displayBlacklist();
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
    };

    btnAddCurrentTab.addEventListener('click', async () => {
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
        const blacklist = await getBlacklist();
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

        const currentBlacklist = await getBlacklist();
        const newBlacklist = [...new Set([...currentBlacklist, ...whitelistFiltered])];

        await setBlacklist(newBlacklist);
        displayBlacklist();
        alert(chrome.i18n.getMessage("alert_import_success", [whitelistFiltered.length]));
        console.log(newBlacklist);
        console.log(whitelistFiltered);
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

    // 从收藏夹导入URL到黑名单
    const importFromBookmarks = async (bookmarkNode) => {
        let count = 0;
        const blacklist = await getBlacklist();
        
        // 递归处理书签文件夹
        const processNode = (node) => {
            if (node.url) {
                try {
                    // 跳过白名单中的URL
                    if (findInWhitelist(node.url)) {
                        return;
                    }

                    // 提取主域名
                    const hostname = new URL(node.url).hostname;
                    const parts = hostname.split('.');
                    const tld = parts.pop();
                    const secondLevelDomain = parts.pop();
                    const primaryDomain = `${secondLevelDomain}.${tld}`;

                    // 如果不在黑名单中，则添加
                    if (!blacklist.includes(primaryDomain)) {
                        blacklist.push(primaryDomain);
                        count++;
                    }
                } catch (e) {
                    console.error("Error processing bookmark URL:", node.url, e);
                }
            }
            // 如果是文件夹，则递归处理
            if (node.children) {
                node.children.forEach(processNode);
            }
        };

        processNode(bookmarkNode);
        
        if (count > 0) {
            await setBlacklist(blacklist);
            alert(chrome.i18n.getMessage("alert_import_bookmark_success", [count.toString()]));
            displayBlacklist();
        }
    };

    btnImportBookmark.addEventListener('click', async () => {
        try {
            // 打开书签选择器
            const bookmarkTree = await chrome.bookmarks.getTree();
            // 创建书签选择对话框
            const dialog = document.createElement('dialog');
            dialog.innerHTML = `
                <h3>${chrome.i18n.getMessage("dialog_select_folder")}</h3>
                <div id="bookmark-tree"></div>
            `;
            document.body.appendChild(dialog);
            
            const renderBookmarkTree = (node, container, level = 0) => {
                const div = document.createElement('div');
                div.style.marginLeft = `${level * 20}px`;
                
                if (node.children) {
                    const btn = document.createElement('button');
                    btn.textContent = node.title || "根目录";
                    btn.onclick = async () => {
                        await importFromBookmarks(node);
                        dialog.close();
                    };
                    div.appendChild(btn);
                }
                
                container.appendChild(div);
                
                if (node.children) {
                    node.children.forEach(child => {
                        if (child.children) { // 只显示文件夹
                            renderBookmarkTree(child, container, level + 1);
                        }
                    });
                }
            };
            
            const treeContainer = dialog.querySelector('#bookmark-tree');
            bookmarkTree.forEach(node => renderBookmarkTree(node, treeContainer));
            
            dialog.showModal();
        } catch (e) {
            console.error("Error importing bookmarks:", e);
        }
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

    displayBlacklist();
});
