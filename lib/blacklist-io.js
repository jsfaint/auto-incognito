// 黑名单导入/导出与书签导入入口的共享逻辑。
// 依赖 BlackList（lib/blacklist.js）与 findInWhitelist（lib/whitelist.js），
// 因此在页面中必须在两者之后加载。

// 导出黑名单为 .txt 文件下载
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

// 从 File 对象导入黑名单：merge + 去重 + 一次写入，避免逐条 add 的多次 storage 读写
const importBlacklistFromFile = async (file) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const filtered = lines.filter(url => !findInWhitelist(url));

    const currentBlacklist = await BlackList.getAll();
    const newBlacklist = [...new Set([...currentBlacklist, ...filtered])];
    await BlackList.set(newBlacklist);
    return filtered.length;
};

// 打开书签导入页面
const openBookmarkImport = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('bookmark.html') });
};

// Common export pattern, supporting both CommonJS and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        exportBlacklist,
        importBlacklistFromFile,
        openBookmarkImport,
    };
}
