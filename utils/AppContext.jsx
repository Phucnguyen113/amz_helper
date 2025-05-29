import { message } from "antd";
import React, {useContext, createContext, useEffect, useRef, useState} from "react";
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
    const [syncing, setSyncing] = useState(false);
    useEffect(() => {
        pinsRef.current = pins;
    }, [pins]);

    const syncPins = () => {
        setSyncing(true);
        const pinsToSync = pins.filter(pin => selectedPins.includes(pin.id));

        const removeNoneUnicode = (str) => str.replace(/[\u0250-\ue007]/g, "-");
        const pinList = [];
        for (let i = 0; i < pinsToSync.length; i++) {
            const pin = pinsToSync[i];
            if (pin.sync_status == 'synced') {
                continue;
            }

            const images = pin?.images;

            const data = {
                id: pin.id,
                key:pin.id,
                high_price: pin?.highPrice || pin?.price || 0,
                low_price: pin?.lowPrice || pin?.price || 0,
                title: removeNoneUnicode(pin.title?.length ? pin.title : "Untitled"),
                description: pin?.description,
                shop_name: pin?.shopName,
                seller_type: pin?.amz ? 'AMZ' : 'FBA',
                product_url: pin?.url,
                reviews: pin?.reviews,
                collection: pin?.collection || null,
                tag: pin?.tag || null,
                trademark: pin?.trademark || null,
                custom: Array.isArray(pin?.custom) ? pin?.custom[[0]] || '' : pin?.custom,
                idea: Array.isArray(pin?.idea) ? pin?.idea[0] || '' : pin?.idea,
                niche: Array.isArray(pin?.niche) ? pin?.niche[0] || '' : pin?.niche,
                images: images,
              };
            pinList.push(data);
        }

        const willSyncIds = pinList.map((i) => i.id);
        const newPins = [...pinsRef.current].map(pin => {
            if (willSyncIds.includes(pin.id)) {
                return {...pin, sync_status: 'syncing'}
            }
            return pin;
        })
        setPins(newPins);

        if (pinList.length) {
            chrome.runtime.sendMessage({
                action: 'savePins',
                key: token,
                pins: pinList
            });
        } else {
            setSyncing(false);
            messageApi.open({
                type: "info",
                content: `No Item(s) selected need to sync`,
                key: "pin_saved",
                duration: 6,
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
                    let infomationPin = {};
                    try {
                        infomationPin = JSON.parse(element?.data?.information);
                    } catch (error) {
                        
                    }
                    if (element?.status) {
                        success.push(infomationPin?.id);
                    } else {
                        error.push(element?.data?.id);
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
                    content: `${success.length} Item(s) saved. ${error.length} Item(s) EXISTS ON THE SYSTEM.`,
                    key: "pin_saved",
                    duration: 6,
                    });
                } else {
                    messageApi.open({
                    type: "warning",
                    content: `${error.length} Item(s) EXISTS ON THE SYSTEM.`,
                    key: "pin_saved",
                    duration: 6,
                    });
                }

                const newPins = pinsRef.current.map(pin => {
                    if (success.includes(pin.id)) {
                        return {...pin, sync_status: 'synced'}
                    } else if(error.includes(pin.id)) {
                        return {...pin, sync_status: 'exist'}
                    }
                    return pin;
                });

                setPins(newPins);
                setSelectedPins([]);
                setSyncing(false);
            }

            if (msg.action == 'savePinsError') {
                const newPins = [...pinsRef.current].map(pin => {
                    if (pin?.sync_status == 'syncing') {
                        return {...pin, sync_status: 'error'}
                    }
                    return pin;
                });

                setPins(newPins);
                setSyncing(false);
                messageApi.open({
                    type: "error",
                    content: `Your network is interrupted or server is dead, pls try again`,
                    key: "pin_saved",
                    duration: 6,
                });
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        }
    }, []);

    return <AppContext.Provider value={{token, setToken, preset, setPreset, pins, setPins, messageApi, presetUsed, setPresetUsed, filter, setFilter, setSelectedPins, syncPins, syncing, setSyncing}} >
        {contextHolder}
        {children}
    </AppContext.Provider>
}

