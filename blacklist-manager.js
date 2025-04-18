document.addEventListener('DOMContentLoaded', async () => {
    console.log('黑名单管理页面加载中...');

    // 国际化处理
    const localizeHtmlPage = () => {
        try {
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
        } catch (error) {
            console.error('国际化处理失败:', error);
        }
    };

    // 尝试调用本地化函数
    try {
        localizeHtmlPage();
    } catch (error) {
        console.error('本地化处理失败:', error);
    }

    // 状态消息显示
    const showStatus = (message, type = 'success') => {
        const statusElem = document.getElementById('statusMessage');
        if (!statusElem) return;

        statusElem.textContent = message;
        statusElem.className = `status ${type}`;
        statusElem.style.display = 'block';

        // 3秒后自动隐藏
        setTimeout(() => {
            statusElem.style.display = 'none';
        }, 3000);
    };

    // 返回按钮
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.close();
            // 确保在新标签中时返回popup
            try {
                chrome.runtime.openOptionsPage();
            } catch (e) {
                window.location.href = 'popup.html';
            }
        });
    }

    // 添加黑名单
    const addButton = document.getElementById('addButton');
    const urlInput = document.getElementById('urlInput');

    if (addButton && urlInput) {
        addButton.addEventListener('click', addUrlToBlacklist);
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addUrlToBlacklist();
            }
        });
    }

    // 选择工具
    const selectAllButton = document.getElementById('selectAllButton');
    const deselectAllButton = document.getElementById('deselectAllButton');
    const deleteSelectedButton = document.getElementById('deleteSelectedButton');

    if (selectAllButton && deselectAllButton && deleteSelectedButton) {
        selectAllButton.addEventListener('click', selectAll);
        deselectAllButton.addEventListener('click', deselectAll);
        deleteSelectedButton.addEventListener('click', deleteSelected);
    }

    // 导入导出功能
    const importButton = document.getElementById('importButton');
    const exportButton = document.getElementById('exportButton');
    const importBookmarkButton = document.getElementById('importBookmarkButton');

    if (importButton && exportButton && importBookmarkButton) {
        importButton.addEventListener('click', importBlacklist);
        exportButton.addEventListener('click', exportBlacklist);
        importBookmarkButton.addEventListener('click', importBookmark);
    }

    // 初始化显示黑名单
    try {
        await loadBlacklist();
    } catch (error) {
        console.error('加载黑名单失败:', error);
        showStatus(chrome.i18n.getMessage('msg_load_fail') || '加载黑名单失败', 'error');
    }

    // 添加网址到黑名单
    async function addUrlToBlacklist() {
        const url = urlInput.value.trim();
        if (!url) {
            showStatus(chrome.i18n.getMessage('msg_empty_url') || '请输入网址', 'error');
            return;
        }

        try {
            const added = await BlackList.add(url);
            urlInput.value = '';

            if (added) {
                showStatus(chrome.i18n.getMessage('msg_add_success') || '添加成功');
            } else {
                showStatus(chrome.i18n.getMessage('msg_already_exists') || '网址已存在', 'error');
            }

            await loadBlacklist();
        } catch (error) {
            console.error('添加到黑名单失败:', error);
            showStatus(chrome.i18n.getMessage('msg_add_fail') || '添加失败', 'error');
        }
    }

    // 加载黑名单列表
    async function loadBlacklist() {
        const blacklistElement = document.getElementById('blacklist');
        const blacklistCountElement = document.getElementById('blacklist-count');

        if (!blacklistElement) return;

        blacklistElement.innerHTML = '';

        try {
            const blacklist = await BlackList.getAll();

            // 更新计数
            if (blacklistCountElement) {
                blacklistCountElement.textContent = `${blacklist.length} ${chrome.i18n.getMessage('label_items') || '项'}`;
            }

            if (!blacklist || blacklist.length === 0) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'empty-list';
                emptyItem.textContent = chrome.i18n.getMessage('msg_empty_blacklist') || '黑名单为空';
                blacklistElement.appendChild(emptyItem);
                return;
            }

            blacklist.forEach(item => {
                const li = document.createElement('li');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'blacklist-item-checkbox';

                const urlSpan = document.createElement('span');
                urlSpan.className = 'blacklist-item-content';
                urlSpan.textContent = item;

                li.appendChild(checkbox);
                li.appendChild(urlSpan);
                blacklistElement.appendChild(li);
            });
        } catch (error) {
            console.error('获取黑名单列表失败:', error);
            blacklistElement.innerHTML = '<div class="empty-list" style="color:red;">加载黑名单失败</div>';
        }
    }

    // 全选功能
    function selectAll() {
        const checkboxes = document.querySelectorAll('.blacklist-item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    // 取消全选
    function deselectAll() {
        const checkboxes = document.querySelectorAll('.blacklist-item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    // 删除选中项
    async function deleteSelected() {
        const selectedUrls = Array.from(
            document.querySelectorAll('#blacklist li .blacklist-item-checkbox:checked')
        )
            .map(checkbox =>
                checkbox.closest('li').querySelector('.blacklist-item-content').textContent
            );

        if (selectedUrls.length === 0) {
            showStatus(chrome.i18n.getMessage('msg_no_selection') || '请先选择要删除的项', 'error');
            return;
        }

        try {
            // 使用批量删除功能
            const successCount = await BlackList.removeBatch(selectedUrls);

            if (successCount > 0) {
                showStatus(
                    chrome.i18n.getMessage('msg_delete_success').replace('{0}', successCount) ||
                    `成功删除 ${successCount} 项`
                );
                await loadBlacklist();
            } else {
                showStatus(chrome.i18n.getMessage('msg_delete_fail') || '删除失败', 'error');
            }
        } catch (error) {
            console.error('批量删除失败:', error);
            showStatus(chrome.i18n.getMessage('msg_delete_fail') || '删除失败', 'error');
        }
    }

    // 导入黑名单
    async function importBlacklist() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                if (file.type !== 'text/plain') {
                    showStatus(chrome.i18n.getMessage('msg_invalid_format') || '无效的文件格式', 'error');
                    return;
                }

                const text = await file.text();
                const lines = text.split('\n').filter(line => line.trim());

                let successCount = 0;
                for (const url of lines) {
                    if (await BlackList.add(url)) {
                        successCount++;
                    }
                }

                if (successCount > 0) {
                    showStatus(
                        chrome.i18n.getMessage('msg_import_success').replace('{0}', successCount) ||
                        `成功导入 ${successCount} 项`
                    );
                    await loadBlacklist();
                } else {
                    showStatus(chrome.i18n.getMessage('msg_import_fail') || '导入失败', 'error');
                }
            } catch (error) {
                console.error('导入文件失败:', error);
                showStatus(chrome.i18n.getMessage('msg_import_fail') || '导入失败', 'error');
            }
        };
        input.click();
    }

    // 导出黑名单
    async function exportBlacklist() {
        try {
            const blacklist = BlackList.getAll();
            const blob = new Blob([blacklist.join('\n')], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'blacklist.txt';
            a.click();
            URL.revokeObjectURL(url);
            showStatus(chrome.i18n.getMessage('msg_export_success') || '导出成功');
        } catch (error) {
            console.error('导出黑名单失败:', error);
            showStatus(chrome.i18n.getMessage('msg_export_fail') || '导出失败', 'error');
        }
    }

    // 从书签导入
    async function importBookmark() {
        try {
            chrome.tabs.create({ url: 'bookmark.html' });
        } catch (error) {
            console.error('打开书签页失败:', error);
            showStatus(chrome.i18n.getMessage('msg_bookmark_fail') || '打开书签页失败', 'error');
        }
    }

    // 显示版本信息
    const versionElement = document.getElementById('version');
    if (versionElement) {
        const manifest = chrome.runtime.getManifest();
        versionElement.textContent = manifest.version;
    }
});