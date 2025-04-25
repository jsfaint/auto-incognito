let selectedNodes; // Save selected bookmark nodes

document.addEventListener('DOMContentLoaded', async () => {
    selectedNodes = new Set(); // Initialize
    const bookmarkTree = await chrome.bookmarks.getTree();
    const treeContainer = document.getElementById('bookmarkTree');

    // Internationalization handling
    document.getElementById('dialogTitle').textContent = chrome.i18n.getMessage("dialog_select_folder");
    document.getElementById('cancelImport').textContent = chrome.i18n.getMessage("button_cancel");
    document.getElementById('confirmImport').textContent = chrome.i18n.getMessage("button_import");

    const renderBookmarkTree = (node, container, level = 0, parent = null) => {
        node.parent = parent; // Record parent node

        const div = document.createElement('div');
        div.className = 'bookmark-item';
        div.style.marginLeft = `${level * 20}px`;

        // Add collapse button
        const toggle = document.createElement('span');
        toggle.className = 'toggle';
        toggle.innerHTML = '▶';
        toggle.style.cursor = 'pointer';
        toggle.style.marginRight = '5px';
        toggle.style.visibility = node.children ? 'visible' : 'hidden';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `bookmark-${node.id}`;

        const label = document.createElement('label');
        label.htmlFor = `bookmark-${node.id}`;
        label.textContent = node.title || chrome.i18n.getMessage("root_folder");

        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children';
        childrenContainer.style.display = 'none';

        div.appendChild(toggle);
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
        container.appendChild(childrenContainer);

        // Collapse/Expand logic
        toggle.addEventListener('click', () => {
            if (childrenContainer.style.display === 'none') {
                childrenContainer.style.display = 'block';
                toggle.innerHTML = '▼';
            } else {
                childrenContainer.style.display = 'none';
                toggle.innerHTML = '▶';
            }
        });

        // Auto expand first level
        if (level === 0) {
            childrenContainer.style.display = 'block';
            toggle.innerHTML = '▼';
        }

        checkbox.addEventListener('change', () => {
            const checked = checkbox.checked;

            // Handle current node
            if (checked) {
                selectedNodes.add(node);
            } else {
                selectedNodes.delete(node);
            }

            // Handle child nodes
            toggleChildren(node, checked);

            // Update parent node state
            updateParentState(node);
        });

        if (node.children) {
            node.children.forEach(child => {
                renderBookmarkTree(child, childrenContainer, level + 1, node);
            });
        }
    };

    bookmarkTree.forEach(node => {
        renderBookmarkTree(node, treeContainer, 0, null);
    });

    document.getElementById('cancelImport').addEventListener('click', () => {
        chrome.tabs.getCurrent(tab => {
            if (tab) chrome.tabs.remove(tab.id);
        });
    });

    document.getElementById('confirmImport').addEventListener('click', async () => {
        if (selectedNodes.size > 0) {
            try {
                const count = await processBookmarks([...selectedNodes]);
                if (count > 0) {
                    alert(chrome.i18n.getMessage("alert_import_bookmark_success", [count]));
                } else {
                    alert(chrome.i18n.getMessage("alert_no_new_records"));
                }
                chrome.tabs.getCurrent(tab => {
                    if (tab) chrome.tabs.remove(tab.id);
                });
            } catch (e) {
                console.error("Import failed:", e);
                alert("Error occurred during import");
            }
        }
    });
});

async function processBookmarks(selectedNodes) {
    try {
        let count = 0;
        const blacklist = await BlackList.getAll();
        const newDomains = [];

        const processNode = (node) => {
            if (node.url) {
                try {
                    if (findInWhitelist(node.url)) return;

                    const hostname = new URL(node.url).hostname;
                    if (!hostname) return;

                    const parts = hostname.split('.');
                    if (parts.length < 2) return;

                    const tld = parts.pop();
                    const secondLevelDomain = parts.pop();
                    const primaryDomain = `${secondLevelDomain}.${tld}`;

                    if (!blacklist.includes(primaryDomain) && !newDomains.includes(primaryDomain)) {
                        newDomains.push(primaryDomain);
                        count++;
                    }
                } catch (e) {
                    // Ignore invalid URLs
                }
            }
            if (node.children) node.children.forEach(processNode);
        };

        selectedNodes.forEach(processNode);

        if (count > 0) {
            await BlackList.set([...blacklist, ...newDomains]);
        }
        return count;
    } catch (e) {
        console.error("Error processing bookmarks:", e);
        return 0;
    }
}

// Update parent node checkbox state
const updateParentState = (node) => {
    if (!node.parent) return;

    const children = node.parent.children;
    const selectedCount = children.filter(child => selectedNodes.has(child)).length;
    const checkbox = document.querySelector(`#bookmark-${node.parent.id}`);

    if (checkbox) {
        checkbox.indeterminate = selectedCount > 0 && selectedCount < children.length;
        checkbox.checked = selectedCount === children.length;
        updateParentState(node.parent);
    }
};

// Recursively check/uncheck children
const toggleChildren = (node, checked) => {
    if (node.children) {
        node.children.forEach(child => {
            // Handle current child node
            if (checked) {
                selectedNodes.add(child);
            } else {
                selectedNodes.delete(child);
            }

            // Update child node checkbox state
            const childCheckbox = document.querySelector(`#bookmark-${child.id}`);
            if (childCheckbox) {
                childCheckbox.checked = checked;
                childCheckbox.indeterminate = false;
            }

            // Recursively handle child's children
            toggleChildren(child, checked);
        });
    }
}; 