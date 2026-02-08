document.addEventListener('DOMContentLoaded', async () => {
    const selectedNodes = new Set();
    const bookmarkTree = await chrome.bookmarks.getTree();
    const treeContainer = document.getElementById('bookmarkTree');

    // Internationalization handling
    document.getElementById('dialogTitle').textContent = chrome.i18n.getMessage("dialog_select_folder");
    document.getElementById('cancelImport').textContent = chrome.i18n.getMessage("button_cancel");
    document.getElementById('confirmImport').textContent = chrome.i18n.getMessage("button_import");

    // Create toggle button for bookmark node
    const createToggleBtn = (node) => {
        const toggle = document.createElement('span');
        toggle.className = 'toggle';
        toggle.innerHTML = '▶';
        toggle.style.cursor = 'pointer';
        toggle.style.marginRight = '5px';
        toggle.style.visibility = node.children ? 'visible' : 'hidden';
        return toggle;
    };

    // Setup toggle collapse/expand behavior
    const setupToggleBehavior = (toggle, childrenContainer) => {
        toggle.addEventListener('click', () => {
            if (childrenContainer.style.display === 'none') {
                childrenContainer.style.display = 'block';
                toggle.innerHTML = '▼';
            } else {
                childrenContainer.style.display = 'none';
                toggle.innerHTML = '▶';
            }
        });
    };

    // Create bookmark checkbox
    const createBookmarkCheckbox = (node) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `bookmark-${node.id}`;
        return checkbox;
    };

    // Setup checkbox change behavior
    const setupCheckboxBehavior = (checkbox, node) => {
        checkbox.addEventListener('change', () => {
            const checked = checkbox.checked;

            if (checked) {
                selectedNodes.add(node);
            } else {
                selectedNodes.delete(node);
            }

            toggleChildren(node, checked, selectedNodes);
            updateParentState(node, selectedNodes);
        });
    };

    // Create bookmark label
    const createBookmarkLabel = (node) => {
        const label = document.createElement('label');
        label.htmlFor = `bookmark-${node.id}`;
        label.textContent = node.title || chrome.i18n.getMessage("root_folder");
        return label;
    };

    // Create children container
    const createChildrenContainer = () => {
        const container = document.createElement('div');
        container.className = 'children';
        container.style.display = 'none';
        return container;
    };

    // Render bookmark tree recursively
    const renderBookmarkTree = (node, container, level = 0, parent = null) => {
        node.parent = parent;

        const div = document.createElement('div');
        div.className = 'bookmark-item';
        div.style.marginLeft = `${level * 20}px`;

        const toggle = createToggleBtn(node);
        const checkbox = createBookmarkCheckbox(node);
        const label = createBookmarkLabel(node);
        const childrenContainer = createChildrenContainer();

        div.appendChild(toggle);
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
        container.appendChild(childrenContainer);

        setupToggleBehavior(toggle, childrenContainer);
        setupCheckboxBehavior(checkbox, node);

        if (level === 0) {
            childrenContainer.style.display = 'block';
            toggle.innerHTML = '▼';
        }

        if (node.children) {
            node.children.forEach(child => {
                renderBookmarkTree(child, childrenContainer, level + 1, node);
            });
        }
    };

    // Update parent node checkbox state
    const updateParentState = (node, selectedNodes) => {
        if (!node.parent) return;

        const children = node.parent.children;
        const selectedCount = children.filter(child => selectedNodes.has(child)).length;
        const checkbox = document.querySelector(`#bookmark-${node.parent.id}`);

        if (checkbox) {
            checkbox.indeterminate = selectedCount > 0 && selectedCount < children.length;
            checkbox.checked = selectedCount === children.length;
            updateParentState(node.parent, selectedNodes);
        }
    };

    // Recursively check/uncheck children
    const toggleChildren = (node, checked, selectedNodes) => {
        if (node.children) {
            node.children.forEach(child => {
                if (checked) {
                    selectedNodes.add(child);
                } else {
                    selectedNodes.delete(child);
                }

                const childCheckbox = document.querySelector(`#bookmark-${child.id}`);
                if (childCheckbox) {
                    childCheckbox.checked = checked;
                    childCheckbox.indeterminate = false;
                }

                toggleChildren(child, checked, selectedNodes);
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
                if (findInWhitelist(node.url)) return;

                const primaryDomain = extractPrimaryDomain(node.url);

                if (primaryDomain && !blacklist.includes(primaryDomain) && !newDomains.includes(primaryDomain)) {
                    newDomains.push(primaryDomain);
                    count++;
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