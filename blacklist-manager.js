document.addEventListener('DOMContentLoaded', async () => {
    console.log('Loading blacklist management page...');

    // Internationalization handling
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
            console.error('Internationalization failed:', error);
        }
    };

    // Try to call localization function
    try {
        localizeHtmlPage();
    } catch (error) {
        console.error('Localization failed:', error);
    }

    // Status message display
    const showStatus = (message, type = 'success') => {
        const statusElem = document.getElementById('statusMessage');
        if (!statusElem) return;

        statusElem.textContent = message;
        statusElem.className = `status ${type}`;
        statusElem.style.display = 'block';

        // Auto hide after 3 seconds
        setTimeout(() => {
            statusElem.style.display = 'none';
        }, 3000);
    };

    // Back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.close();
            // Ensure return to popup when in new tab
            try {
                chrome.runtime.openOptionsPage();
            } catch (e) {
                window.location.href = 'popup.html';
            }
        });
    }

    // Add to blacklist
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

    // Selection tools
    const selectAllButton = document.getElementById('selectAllButton');
    const deselectAllButton = document.getElementById('deselectAllButton');
    const deleteSelectedButton = document.getElementById('deleteSelectedButton');

    if (selectAllButton && deselectAllButton && deleteSelectedButton) {
        selectAllButton.addEventListener('click', selectAll);
        deselectAllButton.addEventListener('click', deselectAll);
        deleteSelectedButton.addEventListener('click', deleteSelected);
    }

    // Import/Export functionality
    const importButton = document.getElementById('importButton');
    const exportButton = document.getElementById('exportButton');
    const importBookmarkButton = document.getElementById('importBookmarkButton');

    if (importButton && exportButton && importBookmarkButton) {
        importButton.addEventListener('click', importBlacklist);
        exportButton.addEventListener('click', exportBlacklist);
        importBookmarkButton.addEventListener('click', importBookmark);
    }

    // Initialize blacklist display
    try {
        await loadBlacklist();
    } catch (error) {
        console.error('Failed to load blacklist:', error);
        showStatus(chrome.i18n.getMessage('msg_load_fail') || 'Failed to load blacklist', 'error');
    }

    // Add URL to blacklist
    async function addUrlToBlacklist() {
        const url = urlInput.value.trim();
        if (!url) {
            showStatus(chrome.i18n.getMessage('msg_empty_url') || 'Please enter URL', 'error');
            return;
        }

        try {
            const added = await BlackList.add(url);
            urlInput.value = '';

            if (added) {
                showStatus(chrome.i18n.getMessage('msg_add_success') || 'Added successfully');
            } else {
                showStatus(chrome.i18n.getMessage('msg_already_exists') || 'URL already exists', 'error');
            }

            await loadBlacklist();
        } catch (error) {
            console.error('Failed to add to blacklist:', error);
            showStatus(chrome.i18n.getMessage('msg_add_fail') || 'Failed to add', 'error');
        }
    }

    // Load blacklist
    async function loadBlacklist() {
        const blacklistElement = document.getElementById('blacklist');
        const blacklistCountElement = document.getElementById('blacklist-count');

        if (!blacklistElement) return;

        blacklistElement.innerHTML = '';

        try {
            const blacklist = await BlackList.getAll();

            // Update count
            if (blacklistCountElement) {
                blacklistCountElement.textContent = `${blacklist.length} ${chrome.i18n.getMessage('label_items') || 'items'}`;
            }

            if (!blacklist || blacklist.length === 0) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'empty-list';
                emptyItem.textContent = chrome.i18n.getMessage('msg_empty_blacklist') || 'Blacklist is empty';
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
            console.error('Failed to get blacklist:', error);
            blacklistElement.innerHTML = '<div class="empty-list" style="color:red;">Failed to load blacklist</div>';
        }
    }

    // Select all function
    function selectAll() {
        const checkboxes = document.querySelectorAll('.blacklist-item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    // Deselect all
    function deselectAll() {
        const checkboxes = document.querySelectorAll('.blacklist-item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    // Delete selected items
    async function deleteSelected() {
        const selectedUrls = Array.from(
            document.querySelectorAll('#blacklist li .blacklist-item-checkbox:checked')
        )
            .map(checkbox =>
                checkbox.closest('li').querySelector('.blacklist-item-content').textContent
            );

        if (selectedUrls.length === 0) {
            showStatus(chrome.i18n.getMessage('msg_no_selection') || 'Please select items to delete', 'error');
            return;
        }

        try {
            // Use batch delete function
            const successCount = await BlackList.removeBatch(selectedUrls);

            if (successCount > 0) {
                showStatus(
                    chrome.i18n.getMessage('msg_delete_success').replace('{0}', successCount) ||
                    `Successfully deleted ${successCount} items`
                );
                await loadBlacklist();
            } else {
                showStatus(chrome.i18n.getMessage('msg_delete_fail') || 'Failed to delete', 'error');
            }
        } catch (error) {
            console.error('Batch delete failed:', error);
            showStatus(chrome.i18n.getMessage('msg_delete_fail') || 'Failed to delete', 'error');
        }
    }

    // Import blacklist
    async function importBlacklist() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                if (file.type !== 'text/plain') {
                    showStatus(chrome.i18n.getMessage('msg_invalid_format') || 'Invalid file format', 'error');
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
                        `Successfully imported ${successCount} items`
                    );
                    await loadBlacklist();
                } else {
                    showStatus(chrome.i18n.getMessage('msg_import_fail') || 'Import failed', 'error');
                }
            } catch (error) {
                console.error('Failed to import file:', error);
                showStatus(chrome.i18n.getMessage('msg_import_fail') || 'Import failed', 'error');
            }
        };
        input.click();
    }

    // Export blacklist
    async function exportBlacklist() {
        try {
            const blacklist = await BlackList.getAll();
            const blob = new Blob([blacklist.join('\n')], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'blacklist.txt';
            a.click();
            URL.revokeObjectURL(url);
            showStatus(chrome.i18n.getMessage('msg_export_success') || 'Export successful');
        } catch (error) {
            console.error('Failed to export blacklist:', error);
            showStatus(chrome.i18n.getMessage('msg_export_fail') || 'Export failed', 'error');
        }
    }

    // Import from bookmarks
    async function importBookmark() {
        try {
            chrome.tabs.create({ url: 'bookmark.html' });
        } catch (error) {
            console.error('Failed to open bookmark page:', error);
            showStatus(chrome.i18n.getMessage('msg_bookmark_fail') || 'Failed to open bookmark page', 'error');
        }
    }

    // Display version information
    const versionElement = document.getElementById('version');
    if (versionElement) {
        const manifest = chrome.runtime.getManifest();
        versionElement.textContent = manifest.version;
    }
});