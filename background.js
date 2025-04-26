chrome.webRequest.onCompleted.addListener(
    (details) => {
        // console.log(details, 123);
        if (
            !["xmlhttprequest"].includes(details.type) ||
            !details.url.includes("etsy.")
            || details.url.includes('from-extension')
        ) {
            return;
        }

        chrome.tabs.sendMessage(details.tabId, {
            action: "urlLoaded",
            url: details.url,
        });
    },
    { urls: ["<all_urls>"] }
);
console.log('work');
// chrome.runtime.onInstalled.addListener(() => {
//     // Đợi 1s cho content script inject xong
//     chrome.alarms.create("trigger_reload", { delayInMinutes: 0.016 });
// });
  
// chrome.alarms.onAlarm.addListener((alarm) => {
// if (alarm.name === "trigger_reload") {
//     chrome.tabs.query({ url: "*://*.pinterest.com/*" }, (tabs) => {
//     tabs.forEach((tab) => {
//         chrome.tabs.sendMessage(tab.id, { action: "reload_page" });
//     });
//     });
// }
// });

const fetchPreset = async (key) => {
    const urls = [
        `https://evo.evolutee.net/api/get-info?key=${encodeURIComponent(key)}`,
        `https://evo.evolutee.net/api/get-niche?key=${encodeURIComponent(key)}`,
        `https://evo.evolutee.net/api/get-idea?key=${encodeURIComponent(key)}`
    ];

    const responses = await Promise.all(urls.map(url => fetch(url)));

    const data = await Promise.all(responses.map(response => response.json()));

    console.log('Dữ liệu từ get-info:', data[0]);
    console.log('Dữ liệu từ get-niche:', data[1]);
    console.log('Dữ liệu từ get-idea:', data[2]);
    //fetch niche & quotes
    const nichesList = await Promise.all(
        (data[2] || []).map(async item => {
            const url = `https://evo.evolutee.net/api/get-niche-by-idea?key=${encodeURIComponent(key)}&idea_id=${item.id}`;
            try {
                const niches = await (await fetch(url)).json();
                return {
                    idea_id: item.id,
                    niches: niches?.data?.map(i => i.niche)
                };
            } catch (error) {
                return {
                    idea_id: item.id,
                    niches: []
                };
            }
        })
    );

    data[1] = nichesList;
    let status = true;
    data.forEach(item => {
        if (item.status === false) {
            status = false;
        }
    })
    data[1] = nichesList;

    return {status: status, data: data};
};

chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
    if (msg.action === 'fetchPreset') {

        const {status , data} = await fetchPreset(msg.key);

        chrome.tabs.sendMessage(sender.tab.id, {
            action: 'fetchPresetDone',
            status: status,
            data: data
        });
    }
})


chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
    if (msg.action === 'savePins') {
        const pins = msg.pins;
        const body = {data: pins};
        const url = `https://evo.evolutee.net/api/v4/etsy/save?key=${encodeURIComponent(msg.key)}`
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body)
            })
            if (!response.ok) {
                throw new Error("Sync failed", response);
            }
            const data = await response.json();  // Chuyển đổi response thành JSON
            console.log('Saved successfully:', data);

            chrome.tabs.sendMessage(sender.tab.id, {
                action: 'savePinsDone',
                status: true,
                data: data.data
            });
        } catch (error) {
            console.log('err', error);
            chrome.tabs.sendMessage(sender.tab.id, {
                action: 'savePinsError',
                status: true,
            });
        }
    }
})