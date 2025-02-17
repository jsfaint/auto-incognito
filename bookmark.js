let selectedNodes; // 在文件顶部声明

document.addEventListener('DOMContentLoaded', async () => {
    selectedNodes = new Set(); // 初始化
    const bookmarkTree = await chrome.bookmarks.getTree();
    const treeContainer = document.getElementById('bookmarkTree');
    
    // 国际化处理
    document.getElementById('dialogTitle').textContent = chrome.i18n.getMessage("dialog_select_folder");
    document.getElementById('cancelImport').textContent = chrome.i18n.getMessage("button_cancel");
    document.getElementById('confirmImport').textContent = chrome.i18n.getMessage("button_import");

    const renderBookmarkTree = (node, container, level = 0, parent = null) => {
        node.parent = parent; // 记录父节点
        
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
            const checked = checkbox.checked;
            
            // 处理当前节点
            if (checked) {
                selectedNodes.add(node);
            } else {
                selectedNodes.delete(node);
            }
            
            // 处理子节点
            toggleChildren(node, checked);
            
            // 更新父节点状态
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
        window.location.href = 'about:blank';
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
                window.location.href = 'about:blank';
            } catch (e) {
                console.error("Import failed:", e);
                alert("导入过程中发生错误");
            }
        }
    });
});

async function processBookmarks(selectedNodes) {
    try {
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
    } catch (e) {
        console.error("Error processing bookmarks:", e);
        return 0;
    }
}

// 更新父节点的勾选状态
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

// 递归勾选/取消子项
const toggleChildren = (node, checked) => {
    if (node.children) {
        node.children.forEach(child => {
            // 处理当前子节点
            if (checked) {
                selectedNodes.add(child);
            } else {
                selectedNodes.delete(child);
            }
            
            // 更新子节点checkbox状态
            const childCheckbox = document.querySelector(`#bookmark-${child.id}`);
            if (childCheckbox) {
                childCheckbox.checked = checked;
                childCheckbox.indeterminate = false;
            }
            
            // 递归处理子节点的子节点
            toggleChildren(child, checked);
        });
    }
}; 