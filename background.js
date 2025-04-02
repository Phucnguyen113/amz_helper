console.log('background work')

chrome.webRequest.onCompleted.addListener(
    (details) => {
        // console.log(details, 123);
        if (
            !["xmlhttprequest"].includes(details.type) ||
            !details.url.includes("pinterest.")
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