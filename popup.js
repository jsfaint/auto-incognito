document.getElementById('addCurrentTabButton').addEventListener('click', function () {
    // 获取当前活动的标签页
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length <= 0) {
            return;
        }

        const url = tabs[0].url; // 获取当前标签的 URL
        const hostname = new URL(url).hostname; // 提取域名

        // 提取一级域名
        const parts = hostname.split('.');
        const tld = parts.pop(); // 顶级域名
        const secondLevelDomain = parts.pop(); // 第二级域名
        const primaryDomain = secondLevelDomain + '.' + tld; // 组合成一级域名

        // 将一级域名添加到黑名单
        chrome.storage.sync.get(['blacklist'], function (result) {
            const blacklist = result.blacklist || [];
            if (!blacklist.includes(primaryDomain)) { // 检查是否已存在
                blacklist.push(primaryDomain);
                chrome.storage.sync.set({ blacklist }, displayBlacklist);
            }
        });
    });
});

// 现有的添加网址到黑名单的代码...
document.getElementById('addButton').addEventListener('click', function () {
    const urlInput = document.getElementById('urlInput').value.trim();
    if (!urlInput) {
        return;
    }

    chrome.storage.sync.get(['blacklist'], function (result) {
        const blacklist = result.blacklist || [];
        if (!blacklist.includes(urlInput)) {
            blacklist.push(urlInput);
            chrome.storage.sync.set({ blacklist }, displayBlacklist);
        }
    });
});

// 显示黑名单
function displayBlacklist() {
    chrome.storage.sync.get(['blacklist'], function (result) {
        const blacklist = result.blacklist || [];
        const blacklistElement = document.getElementById('blacklist');
        blacklistElement.innerHTML = '';
        blacklist.forEach(url => {
            const li = document.createElement('li');
            li.textContent = url;
            li.addEventListener('click', function () {
                removeFromBlacklist(url);
            });
            blacklistElement.appendChild(li);
        });
    });
}

function removeFromBlacklist(url) {
    chrome.storage.sync.get(['blacklist'], function (result) {
        let blacklist = result.blacklist || [];
        blacklist = blacklist.filter(item => item !== url);
        chrome.storage.sync.set({ blacklist }, displayBlacklist);
    });
}

// 初始显示黑名单
displayBlacklist();
