import { Badge, Button, Drawer, Space } from "antd";
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import React, { useEffect, useState, useRef } from "react";
import $ from "jquery";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";

import { useChromeStorageLocal } from "use-chrome-storage";
import './app.css';
import axios from './Axios';
import SpinTable from './Table';
import { useAppContext } from "./utils/AppContext";
import TokenSettings from "./component/TokenSettings";
import Settings from "./component/Setting";
import Preset from "./component/Preset";
import { usePresetGrouped } from "./utils/hook";

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "1s",
    m: "1m",
    mm: "%dm",
    h: "1h",
    hh: "%dh",
    d: "1d",
    dd: "%dd",
    M: "1M",
    MM: "%dM",
    y: "1Y",
    yy: "%dY",
  },
});

const App = () => {
    const [openDrawer, setOpenDrawer] = useState(false);
    const [presetOpen, setPresetOpen] = useState(false);
    const [itemsSelected, setItemsSelected] = useState(0);
    const [width, setWidthDrawer] = useState(1200);
    const {pins, setPins, token, setToken, preset, presetUsed} = useAppContext();
    const [trademarks, collections, customs, whitelist, blacklist, niches, ideas] = usePresetGrouped();

    const whitelistRef = useRef(whitelist);
    useEffect(() => {
        whitelistRef.current = whitelist;
    }, [whitelist]);

    const blacklistRef = useRef(blacklist);
    useEffect(() => {
        blacklistRef.current = blacklist;
    }, [blacklist]);

    const pinsRef = useRef(pins);
    useEffect(() => {
        pinsRef.current = pins;
    }, [pins]);

    const clearPins = () => {
        setPins([]);
    };

    const fetchPinInfor = async (pinId) => {
        const response =  await axios.get(`https://www.pinterest.com/pin/${pinId}/?from-extension=true`);

        const htmlString = response.data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        const scripts = doc.querySelectorAll('script');

        let pinData;
        for (const script of scripts) {
            const scriptContent = script.textContent || script.innerText;
            try {
                const json = JSON.parse(scriptContent);

                if (json?.response?.data?.v3GetPinQuery?.data) {
                    const pinObject = json?.response?.data?.v3GetPinQuery?.data
                    pinData = {
                        image: pinObject?.imageSpec_236x?.url,
                        description: pinObject?.gridDescription,
                        title: pinObject?.gridTitle,
                    }
                    break;
                }

                if (script.id === '__PWS_INITIAL_PROPS__') {
                    if (json?.initialReduxState?.pins?.[pinId]) {
                        const pinObject = json?.initialReduxState?.pins?.[pinId];
                        console.log('pinObject', pinObject);
                        // console.log('pinObject', pinObject);
                        let reactionCount = 0;
                        Object.values(pinObject?.reaction_counts || {}).map((n) => {
                          reactionCount += n;
                        });

                        let title = pinObject?.title || "";
                        if (!title?.length) {
                          title = pinObject?.rich_metadata?.title?.length
                            ? pinObject?.rich_metadata?.title
                            : pinObject?.grid_title;
                        }
                        if (!title) {
                          title = "";
                        }
                        let user = pinObject?.native_creator
                            ? pinObject?.native_creator
                            : pinObject?.closeup_attribution;
                        
                        let additionalImages = [];
                        if (pinObject?.rich_metadata?.products?.[0]?.has_multi_images) {
                            additionalImages = pinObject?.rich_metadata?.products?.[0]?.additional_images?.map(image => {
                                return image?.canonical_images?.['736x'].url;
                            });
                        }
                        pinData =  {
                            id: pinObject?.id,
                            comment: pinObject?.aggregated_pin_data?.comment_count,
                            createdDate: new Date(pinObject?.created_at).toISOString(),
                            title: title,
                            image: pinObject?.images?.['236x']?.url,
                            additional_images: additionalImages,
                            reaction: reactionCount,
                            share: pinObject?.share_count ?? 0,
                            repin: pinObject?.repin_count ?? 0,
                            saved: pinObject?.aggregated_pin_data?.aggregated_stats?.saves,
                            full_name: user?.full_name || "",
                            username: user?.username || "",
                            domain: pinObject?.domain
                        }
                        break;
                    }                
                }
            } catch (error) {
                // console.log('Parse failed');
            }
        }
        return pinData;
    }

    const reloadPins = async (pinIds) => {
        const newPins = await Promise.all(
            pins.map(async (pin) => {
                if (pinIds.includes(pin.id)) {
                    const pinItem = await fetchPinInfor(pin.id);
                    return { ...pin, ...pinItem };
                }
                return pin; 
            })
        );
        setPins(newPins);
    }

    const showDrawer = () => {
        setOpenDrawer(true);
      };
    
    const closeDrawer = () => {
        setOpenDrawer(false);
    };

    const hightlightType = (pin) => {
        const { _highlight } = presetUsed;
        
        if (!pin.title) {
            return 'warning';
        }

        if (pin.title && blacklist?.length) {
            for (let index = 0; index < blacklist.length; index++) {
                if (pin.title.toLowerCase().includes(blacklist[index])) {
                    return 'error';
                }
            }
        }

        let d = '';
        let hl = false;
        if (pin?.createdDate?.length > 0) {
            let sd = pin?.createdDate.split("T")[0];
            const dd = dayjs(sd);
            if (_highlight && _highlight > 0) {
              const now = dayjs();
              const diff = now.diff(dd, "month", true);
              if (diff <= _highlight) {
                hl = true;
                return'ok'
              }
            }
            d = dd.fromNow(true); // 22 years
        }

        if (pin.title && whitelist?.includes(pin.title)) {
            hl = true;
            return 'ok'
        }
    }

    // listen pinterest fetch data & inject checkbox
    useEffect(() => {
        const updatePinCheckbox = (message, sender, sendResponse) => {
            switch (message.action) {
                case "urlLoaded":
                    const renderPinDetailOrRelatedPin = async () => {
                        const element =  $('div[data-test-id="visual-content-container"]');
                        if (!element) return;
                        const regex = /\/pin\/(\d+)\//;
    
                        const match = window.location.pathname.match(regex);
                        if (match) {
                            const id = match[1]; // The ID is captured in the first group
                            if (id) {
                                $(element).attr('data-test-pin-id', id)
                                .css('position', 'relative');
                            }
                        }

                        const element2 =  $('div[data-test-id="flashlight-enabled-image"]');
                        if (!element2) return;
    
                        const match2 = window.location.pathname.match(regex);
                        if (match2) {
                            const id = match2[1]; // The ID is captured in the first group
                            if (id) {
                                $(element2).attr('data-test-pin-id', id);                            }
                        }
                    }
                    renderPinDetailOrRelatedPin();
                // console.log('re render checkbox', pinsRef.current.map(pin => pin.id))
                $('div[data-test-pin-id]').each( async function (index, element) {
                    const id = $(element).attr('data-test-pin-id');
                    $(element).css('position', 'relative');
                    const data = await fetchPinInfor(id);
                    const typeHightlight = hightlightType(data);
                    data.hightlight = typeHightlight;

                    $(element).removeClass('warning-pin error-pin ok-pin');

                    $(element).addClass(`${typeHightlight}-pin`);
                    $(element).find(`#inject-${id}`).remove();

                    let d = '';
                    if (data?.createdDate?.length > 0) {
                        let sd = data?.createdDate.split("T")[0];
                        const dd = dayjs(sd);

                        d = dd.fromNow(true); // 22 years
                    }
                    // data-pin=${JSON.stringify(data)}
                    const ButtonWrapper = $(`
                        <div id="inject-${id}" class="saph-inject-data">
                            <div class="saph-domain">${data?.domain || "..."}</div>
                            <div class="saph-stats">
                                <div title="saved count"><i class="saic-saved"></i>  ${data?.saved || 0}</div>
                                <div title="reaction count"><i class="saic-reaction"></i> ${data?.reaction || 0}</div>
                                <div title="repin count"><i class="saic-repin"></i> ${data?.repin || 0}</div>
                                <div title="share count"><i class="saic-share"></i> ${data?.share || 0}</div>
                                <div class="sahp-dati" title="Date added ${data?.createdDate || ""}"><i class="saic-date"></i> ${d}</div>
                                <div class="sahp-custm" title="Is custom type">Type Custom</div>
                            </div>
                                <input class="saph-check"  data-id="${id}" type="checkbox" ${pinsRef.current.map(pin => pin.id).includes(id) ? 'checked' : ''} />
                        </div>
                    `);
                    $(element).append(ButtonWrapper);
                });
                break;
            }
        };
        const requiredProperties = ['collection', 'custom', 'idea', 'niche', 'trademark'];
        const hasAllProperties = requiredProperties.every(prop => presetUsed.hasOwnProperty(prop));

        if (!token || preset.length < 3 || !hasAllProperties) {
            return;
        }

        chrome.runtime.onMessage.addListener(updatePinCheckbox);

        return () => {
            console.log('clear update pin')
            chrome.runtime.onMessage.removeListener(updatePinCheckbox);
        };
    }, [pins, presetUsed, token, preset])

    //handle checkbox
    useEffect(() => {
        const handleChangeCheckbox = async function (e, index) {
            const pinId = $(e.currentTarget).attr('data-id');

            if (e.currentTarget.checked) {
                const pinInfor = await fetchPinInfor(pinId);
                console.log('click', {...pinInfor, ...presetUsed}, presetUsed);
                setPins([...pinsRef.current, {...pinInfor, ...presetUsed}]);
            } else {
                setPins([...pinsRef.current.filter(item => item.id != pinId)]);
            }
         };
        $(document).on('change', '.saph-check', handleChangeCheckbox)

        return () => {
            $(document).off('change', '.saph-check', handleChangeCheckbox);
        };
    }, [presetUsed])

    return (
        <div style={{position: 'fixed', bottom: '100px', right: '10px'}} >
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <Preset isOpen={presetOpen} setOpen={setPresetOpen}></Preset>
                <Badge size="small" count={pins.length} style={{marginTop: '10px'}}>
                    <Button style={{padding: '12px 20px'}} type="primary" size="small" onClick={showDrawer}>Spins</Button>
                </Badge>
            </div>
            <Drawer
                id="pin-drawer"
                style={{zindex: 10000}}
                title="Pinterest Helper"
                placement={'right'}
                closable={false}
                onClose={closeDrawer}
                open={openDrawer}
                width={width}
                key={'right'}
                extra={
                    <Space>
                        <Space>
                            {itemsSelected ? <span className="item-selected-span">{itemsSelected} / {pins.length || 0} items selected</span> : <span>{' '}</span>}
                        </Space>
                        <Space>
                            <Button
                                onClick={(e) => {
                                    setPresetOpen(true);
                                    setOpenDrawer(false);
                                }}
                                >
                                Preset
                            </Button>
                            
                            <Button onClick={() => clearPins()}> ClearPin</Button>
                            {/* <Button onClick={() => setToken(null)}> ClearToken</Button> */}
                            <Settings />
                            <Button onClick={() => setWidthDrawer(width > 1200 ? 1200 : window.innerWidth)}> {width > 1200 ? <FullscreenExitOutlined /> : <FullscreenOutlined />}</Button>
                        </Space>
                    </Space>
                }
            >
                {token ? <SpinTable
                            hightlightPinType={hightlightType}
                            dataSource={pins}
                            setItemsSelected={setItemsSelected}
                            reloadPins={reloadPins}
                        /> 
                        : <TokenSettings />}
                
            </Drawer>
        </div>
    );
}

export default App;