import { message } from "antd";
import React, {useContext, createContext} from "react";
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
    return <AppContext.Provider value={{token, setToken, preset, setPreset, pins, setPins, messageApi, presetUsed, setPresetUsed, filter, setFilter}} >
        {contextHolder}
        {children}
    </AppContext.Provider>
}

