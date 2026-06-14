// Shared logic for blacklist import/export and bookmark-import entry points.
// Depends on BlackList (lib/blacklist.js) and findInWhitelist (lib/whitelist.js),
// so it must be loaded after both in the page.

// Export the blacklist as a .txt file download
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

// Import the blacklist from a File object: merge + dedupe + single write,
// avoiding the repeated storage reads/writes of calling add() per entry.
const importBlacklistFromFile = async (file) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const filtered = lines.filter(url => !findInWhitelist(url));

    const currentBlacklist = await BlackList.getAll();
    const newBlacklist = [...new Set([...currentBlacklist, ...filtered])];
    await BlackList.set(newBlacklist);
    return filtered.length;
};

// Open the bookmark import page
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
