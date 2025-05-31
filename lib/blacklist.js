const BlackList = {
    // Get all blacklist items
    getAll: async function () {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['blacklist'], function (result) {
                resolve(result.blacklist || []);
            });
        });
    },

    // Add item to blacklist
    add: async function (url) {
        const blacklist = await this.getAll();

        // If already exists, return directly
        if (blacklist.includes(url)) {
            return false;
        }

        // Add new item and save
        blacklist.push(url);
        return new Promise((resolve) => {
            chrome.storage.sync.set({ blacklist }, () => resolve(true));
        });
    },

    // Remove item from blacklist
    remove: async function (url) {
        const blacklist = await this.getAll();
        const index = blacklist.indexOf(url);

        // If not exists, return directly
        if (index === -1) {
            return false;
        }

        // Remove item and save
        blacklist.splice(index, 1);
        return new Promise((resolve) => {
            chrome.storage.sync.set({ blacklist }, () => resolve(true));
        });
    },

    // Batch remove blacklist items
    removeBatch: async function (urls) {
        if (!urls || !urls.length) return 0;

        const blacklist = await this.getAll();
        let count = 0;

        urls.forEach(url => {
            const index = blacklist.indexOf(url);
            if (index !== -1) {
                blacklist.splice(index, 1);
                count++;
            }
        });

        if (count > 0) {
            await new Promise((resolve) => {
                chrome.storage.sync.set({ blacklist }, () => resolve());
            });
        }

        return count;
    },

    // Check if URL is in blacklist
    check: async function (url) {
        if (!url) return false;

        const extensionId = chrome.runtime.id;
        const builtin_pages = [
            //Microsoft Edge
            `extension://${extensionId}/blacklist-manager.html`,
            `extension://${extensionId}/bookmark.html`,
            //Google Chrome
            `chrome-extension://${extensionId}/blacklist-manager.html`,
            `chrome-extension://${extensionId}/bookmark.html`,
        ];

        if (builtin_pages.some(extensionUrl => url === extensionUrl)) {
            return true;
        }

        try {
            // Try to extract hostname
            const hostname = new URL(url).hostname;
            if (!hostname) return false;

            const blacklist = await this.getAll();
            if (!Array.isArray(blacklist) || blacklist.length === 0) {
                return false;
            }

            // Check if matches any blacklist item
            return blacklist.some(pattern => hostname.includes(pattern));
        } catch (e) {
            console.error("Error checking URL against blacklist:", e);
            return false;
        }
    },

    // Set blacklist
    set: async function (blacklist) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ blacklist: blacklist }, function () {
                resolve(true);
            });
        });
    }
};

// Common export pattern, supporting both CommonJS and browser environments
if (typeof module !== 'undefined' && module.exports) {
    // In Node.js/Bun environment
    module.exports = { BlackList };
}