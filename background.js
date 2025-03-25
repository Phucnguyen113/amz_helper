console.log('background work')

chrome.webRequest.onCompleted.addListener(
    (details) => {
        console.log(details);
        if (
            !["xmlhttprequest"].includes(details.type) ||
            !details.url.includes("pinterest.")
        ) {
            return;
        }
        console.log(details.url);
        chrome.tabs.sendMessage(details.tabId, {
            action: "urlLoaded",
            url: details.url,
        });
    },
    { urls: ["<all_urls>"] }
);