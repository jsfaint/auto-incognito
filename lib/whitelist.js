function findInWhitelist(url) {
    const whitelist = [
        "about:blank",
        "chrome://",
        "edge://",
    ];

    for (const u of whitelist) {
        if (url.includes(u)) {
            return true;
        }
    }

    return false;
}
