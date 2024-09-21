document.getElementById('addButton').addEventListener('click', function () {
    const urlInput = document.getElementById('urlInput').value.trim();
    if (urlInput) {
        chrome.storage.sync.get(['blacklist'], function (result) {
            const blacklist = result.blacklist || [];
            blacklist.push(urlInput);
            chrome.storage.sync.set({ blacklist }, displayBlacklist);
        });
    }
});

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
