"use strict";

/**
 * Constants for common values
 */
const STATUS_MESSAGE_DURATION = 3000;

/**
 * Localize HTML page by replacing __MSG_***__ meta tags
 */
const localizeHtmlPage = () => {
    const objects = document.getElementsByTagName('html');
    for (let j = 0; j < objects.length; j++) {
        const obj = objects[j];
        const valStrH = obj.innerHTML.toString();
        const valNewH = valStrH.replace(/__MSG_(\w+)__/g, (match, v1) => {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if (valNewH !== valStrH) {
            obj.innerHTML = valNewH;
        }
    }
};

/**
 * Extract primary domain from URL
 * @param {string} url - The URL to extract domain from
 * @returns {string|null} The primary domain (e.g., "example.com") or null if invalid
 */
const extractPrimaryDomain = (url) => {
    try {
        const hostname = new URL(url).hostname;
        if (!hostname) return null;

        const parts = hostname.split('.');
        if (parts.length < 2) return null;

        const tld = parts.pop();
        const secondLevelDomain = parts.pop();
        return `${secondLevelDomain}.${tld}`;
    } catch (e) {
        console.warn('Unable to extract domain from URL:', url, e);
        return null;
    }
};

/**
 * Show status message with auto-hide
 * @param {string} message - The message to display
 * @param {string} type - The message type ('success' or 'error')
 */
const showStatusMessage = (message, type = 'success') => {
    const statusElem = document.getElementById('statusMessage');
    if (!statusElem) return;

    statusElem.textContent = message;
    statusElem.className = `status ${type}`;
    statusElem.style.display = 'block';

    setTimeout(() => {
        statusElem.style.display = 'none';
    }, STATUS_MESSAGE_DURATION);
};

// Common export pattern, supporting both CommonJS and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STATUS_MESSAGE_DURATION,
        localizeHtmlPage,
        extractPrimaryDomain,
        showStatusMessage
    };
}