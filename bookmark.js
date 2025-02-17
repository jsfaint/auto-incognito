document.addEventListener('DOMContentLoaded', async () => {
    const bookmarkTree = await chrome.bookmarks.getTree();
    const treeContainer = document.getElementById('bookmarkTree');
    const selectedNodes = new Set();
    
    // 国际化处理
    document.getElementById('dialogTitle').textContent = chrome.i18n.getMessage("dialog_select_folder");
    document.getElementById('cancelImport').textContent = chrome.i18n.getMessage("button_cancel");
    document.getElementById('confirmImport').textContent = chrome.i18n.getMessage("button_import");

    const renderBookmarkTree = (node, container, level = 0) => {
        const div = document.createElement('div');
        div.className = 'bookmark-item';
        div.style.marginLeft = `${level * 20}px`;

        // 添加折叠按钮
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

        // 折叠/展开逻辑
        toggle.addEventListener('click', () => {
            if (childrenContainer.style.display === 'none') {
                childrenContainer.style.display = 'block';
                toggle.innerHTML = '▼';
            } else {
                childrenContainer.style.display = 'none';
                toggle.innerHTML = '▶';
            }
        });

        // 自动展开第一级
        if (level === 0) {
            childrenContainer.style.display = 'block';
            toggle.innerHTML = '▼';
        }

        checkbox.addEventListener('change', () => {
            checkbox.checked ? selectedNodes.add(node) : selectedNodes.delete(node);
        });

        if (node.children) {
            node.children.forEach(child => {
                renderBookmarkTree(child, childrenContainer, level + 1);
            });
        }
    };

    bookmarkTree.forEach(node => renderBookmarkTree(node, treeContainer));

    document.getElementById('cancelImport').addEventListener('click', () => {
        window.location.href = 'about:blank';
    });

    document.getElementById('confirmImport').addEventListener('click', async () => {
        if (selectedNodes.size > 0) {
            const count = await processBookmarks([...selectedNodes]);
            if (count > 0) {
                alert(chrome.i18n.getMessage("alert_import_bookmark_success", [count]));
                window.location.href = 'about:blank';
            }
        }
    });
});

async function processBookmarks(selectedNodes) {
    let count = 0;
    const blacklist = await getBlacklist();
    
    const processNode = (node) => {
        if (node.url) {
            try {
                if (findInWhitelist(node.url)) return;

                const hostname = new URL(node.url).hostname;
                const parts = hostname.split('.');
                const tld = parts.pop();
                const secondLevelDomain = parts.pop();
                const primaryDomain = `${secondLevelDomain}.${tld}`;

                if (!blacklist.includes(primaryDomain)) {
                    blacklist.push(primaryDomain);
                    count++;
                }
            } catch (e) {
                console.error("Error processing URL:", node.url, e);
            }
        }
        if (node.children) node.children.forEach(processNode);
    };

    selectedNodes.forEach(processNode);
    
    if (count > 0) {
        await setBlacklist(blacklist);
        chrome.runtime.sendMessage({action: "updateBlacklist"});
    }
    return count;
} 