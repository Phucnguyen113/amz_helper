import { message } from "antd";
import React, {useContext, createContext, useEffect, useRef} from "react";
import { useChromeStorageLocal } from "use-chrome-storage";

const AppContext = createContext({});

export const useAppContext = () => {
    return useContext(AppContext);
}

export const AppProvider = ({children}) => {
    const [token, setToken] = useChromeStorageLocal("token", null);
    const [preset, setPreset] = useChromeStorageLocal('preset', {});
    const [presetUsed, setPresetUsed] = useChromeStorageLocal('presetUsed', {});
    const [pins, setPins] = useChromeStorageLocal('pins', []);
    const [filter, setFilter] = useChromeStorageLocal("filter", {});
    const [messageApi, contextHolder] = message.useMessage();
    const [selectedPins, setSelectedPins] = useChromeStorageLocal('selectedPins', []);
    const pinsRef = useRef(pins);
    useEffect(() => {
        pinsRef.current = pins;
    }, [pins]);

    const syncPins = () => {
        const pinsToSync = pins.filter(pin => selectedPins.includes(pin.id));

        const removeNoneUnicode = (str) => str.replace(/[\u0250-\ue007]/g, "-");
        const pinList = [];
        for (let i = 0; i < pinsToSync.length; i++) {
            const pin = pinsToSync[i];
            if (pin.sync_status == 'synced') {
                continue;
            }

            let video = null;

            if (pin.videos) {
              if (pin?.videos?.V_720P) {
                video = pin?.videos?.V_720P.url;
              }
              if (!video) {
                if (pin?.videos?.V_HLSV3_WEB) {
                  video = pin?.videos?.V_HLSV3_WEB.url;
                }
              }
              if (!video) {
                if (pin?.videos?.V_HLSV4) {
                  video = pin?.videos?.V_HLSV4.url;
                }
              }
            }
            const images = [
                pin?.image,
                ...pin?.additional_images.splice(0, 3)
            ].join(';');

            const data = {
                id: pin.id,
                pid: pin.id,
                title: removeNoneUnicode(pin.title?.length ? pin.title : "Untitled"),
                date: pin.createdDate,
                qty_pin: pin.repin,
                qty_save: pin.saved,
                full_name: removeNoneUnicode(pin?.full_name || "no-name"),
                user_name: removeNoneUnicode(pin?.username || "no-username"),
                domain: pin.domain,
                link: `https://www.pinterest.com/pin/${pin.id}/`,
                collection: pin?.collection || null,
                trademark: pin?.trademark || null,
                custom: Array.isArray(pin?.custom) ? pin?.custom[[0]] || '' : pin?.custom,
                idea: Array.isArray(pin?.idea) ? pin?.idea[0] || '' : pin?.idea,
                niche: Array.isArray(pin?.niche) ? pin?.niche[0] || '' : pin?.niche,
                image: images,
                video: video,
                keyword: pin?.keyword,
                related_keyword: pin?.relatedKeyword,
              };
            pinList.push(data);
        }

        console.log('sync pins', pinList);
        const willSyncIds = pinList.map((i) => i.pid);
        setPins(prev => {
            return prev.map(pin => {
                if (willSyncIds.includes(pin.id)) {
                    return {...pin, sync_status: 'syncing'}
                }
                return pin;
            })
        });

        if (pinList.length) {
            chrome.runtime.sendMessage({
                action: 'savePins',
                key: token,
                pins: pinList
            });
        }
    }

    useEffect(() => {
        const listener = async function (msg, sender, sendResponse) {
            if (msg.action == 'savePinsDone') {
                const data = msg.data;
                const success = [];
                const error = [];

                for (let i = 0; i < data.length; i++) {
                    const element = data[i];

                    if (element?.status) {
                        success.push(element?.data?.pid);
                    } else {
                        error.push(element?.data?.pid);
                    }
                }

                if (success.length > 0 && error.length === 0) {
                    messageApi.open({
                    type: "success",
                    content: `${success.length} Item(s) saved!`,
                    key: "pin_saved",
                    duration: 6,
                    });
                } else if (success.length > 0 && error.length > 0) {
                    messageApi.open({
                    type: "info",
                    content: `${success.length} Item(s) saved. ${error.length} Item(s) synced error.`,
                    key: "pin_saved",
                    duration: 6,
                    });
                } else {
                    messageApi.open({
                    type: "error",
                    content: `${error.length} Item(s) synced error.`,
                    key: "pin_saved",
                    duration: 6,
                    });
                }

                const newPins = pinsRef.current.map(pin => {
                    if (success.includes(pin.id)) {
                        return {...pin, sync_status: 'synced'}
                    } else if(error.includes(pin.id)) {
                        return {...pin, sync_status: 'error'}
                    }
                    return pin;
                });

                setPins(newPins);
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        }
    }, []);

    return <AppContext.Provider value={{token, setToken, preset, setPreset, pins, setPins, messageApi, presetUsed, setPresetUsed, filter, setFilter, setSelectedPins, syncPins}} >
        {contextHolder}
        {children}
    </AppContext.Provider>
}

