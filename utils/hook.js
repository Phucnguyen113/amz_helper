import React, { useEffect, useState } from "react";
import { useAppContext } from "./AppContext";

export const usePresetGrouped = () => {
    const {preset} = useAppContext();
    const [trademarks, setTrademarks] = useState(null);
    const [collections, setCollections] = useState(null);
    const [customs, setCustoms] = useState(null);
    const [whitelist, setWhitelist] = useState(null);
    const [blacklist, setBlacklist] = useState(null);
    const [niches, setNiches] = useState(null);
    const [ideas, setIdeas] = useState(null);

     useEffect(() => {
        const {trademark, collections, customs, whitelist, blacklist} = preset?.[0] ?? {};
        const niches = preset?.[1] || [];
        const ideas = preset?.[2] || [];
        setTrademarks(trademark?.map(item => {
            return {
                ...item,
                value: item.id,
                label: item.name
            } 
        }));

        setCollections(collections?.map(item => {
            return {
                ...item,
                value: item.id,
                label: item.name
            } 
        }));


        setCustoms(customs?.map(item => {
            return {
                ...item,
                value: item.id,
                label: item.name
            } 
        }));

        setWhitelist(whitelist);
        setBlacklist(blacklist);

        setNiches(niches?.map(item => {
            const newNiches = item?.niches?.map(i => {
                return {
                    ...i,
                    value: i.id,
                    label: i.name
                }
            });
            item.niches = newNiches;
            return item;
        }));

        setIdeas(ideas?.map(item => {
            return {
                ...item, 
                value: item.id,
                label: item.name
            }
        }));
    }, [preset]);

    return [trademarks, collections, customs, whitelist, blacklist, niches, ideas];
}