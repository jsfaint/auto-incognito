const findInWhitelist = (url) => {
    const whitelist = [
        "about:blank",
        "chrome://",
        "edge://",
    ];

    return whitelist.some(item => url.includes(item));
};
