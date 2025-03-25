import { Badge, Button, Drawer, Space } from "antd";
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import React, { useEffect, useState, useRef } from "react";
import $ from "jquery";
import { useChromeStorageLocal } from "use-chrome-storage";
import './app.css';
import axios from 'axios';
import SpinTable from './Table';


const App = () => {
    const [openDrawer, setOpenDrawer] = useState(false);
    const [width, setWidthDrawer] = useState(700);
    const [pins, setPins] = useChromeStorageLocal('pins', []);

    const pinsRef = useRef(pins);

    useEffect(() => {
        pinsRef.current = pins;
    }, [pins]);

    const clearPins = () => {
        chrome.storage.local.clear(() => {
            setPins([]);
            console.log('Local Storage cleared!');
        });
    };

    const fetchPinInfor = async (pinId) => {
        const response =  await axios.get(`https://www.pinterest.com/pin/${pinId}/`);

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
                        pinData =  {
                            id: pinObject?.id,
                            commentCount: pinObject?.aggregated_pin_data?.comment_count,
                            createdDate: pinObject?.created_at,
                            title: pinObject?.grid_title,
                            image: pinObject?.images?.['236x']?.url,
                            reactionCount: pinObject?.reaction_counts?.[1] ?? 0,
                            shareCount: pinObject?.share_count?.[1] ?? 0,
                            
                        }
                        break;
                    }                
                }
            } catch (error) {
                console.log('Parse failed');
            }
        }
        return pinData;
    }

    const showDrawer = () => {
        setOpenDrawer(true);
      };
    
    const closeDrawer = () => {
        setOpenDrawer(false);
    };

    // listen pinterest fetch data & inject checkbox
    useEffect(() => {
        const updatePinCheckbox = (message, sender, sendResponse) => {
            switch (message.action) {
                case "urlLoaded":
                const data = {};
                console.log('re render checkbox', pinsRef.current.map(pin => pin.id))
                $('div[data-test-pin-id]').each(function (index, element) {
                    const id = $(element).attr('data-test-pin-id');
                    const ButtonWrapper = $(`
                        <div class="saph-inject-data saph-hlok">
                            <div class="saph-domain">${data?.domain || "..."}</div>
                            <div class="saph-stats">
                                <div title="saved count"><i class="saic-saved"></i>  ${data?.saved || 0}</div>
                                <div title="reaction count"><i class="saic-reaction"></i> ${data?.reaction || 0}</div>
                                <div title="repin count"><i class="saic-repin"></i> ${data?.repin || 0}</div>
                                <div title="share count"><i class="saic-share"></i> ${data?.share || 0}</div>
                                <div class="sahp-dati" title="Date added ${data?.date || ""}"><i class="saic-date"></i> ${'ddddd'}</div>
                                <div class="sahp-custm" title="Is custom type">Type Custom</div>
                            </div>
                                <input class="saph-check" data-id="${id}" type="checkbox" ${pinsRef.current.map(pin => pin.id).includes(id) ? 'checked' : ''} />
                        </div>
                    `);
                    $(element).append(ButtonWrapper);
                })
                break;
            }
        };
        chrome.runtime.onMessage.addListener(updatePinCheckbox);

        return () => {
            console.log('clear update pin')
            chrome.runtime.onMessage.removeListener(updatePinCheckbox);
        };
    }, [pins])

    useEffect(() => {
        const handleChangeCheckbox = async function (e, index) {
            const pinId = $(e.currentTarget).attr('data-id');
            console.log('pinId', pinId)
            if (e.currentTarget.checked) {
                const pinInfor = await fetchPinInfor(pinId);
                console.log('pinInfor', pinInfor);

                setPins([...pinsRef.current, pinInfor]);
            } else {
                setPins([...pinsRef.current.filter(item => item.id != pinId)]);
            }
         };
        $(document).on('change', '.saph-check', handleChangeCheckbox)

         return () => {
            $(document).off('change', '.saph-check', handleChangeCheckbox);
        };
    }, [])

    return (
        <div style={{position: 'fixed', bottom: '10px', right: '10px'}} >
            <Badge count={pins.length}>
                <Button type="primary" onClick={showDrawer}>Spins</Button>
            </Badge>
            <Drawer
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
                        <Button onClick={() => clearPins()}> ClearPin</Button>
                        <Button onClick={() => setWidthDrawer(width > 700 ? 700 : 1200)}> {width > 700 ? <FullscreenExitOutlined /> : <FullscreenOutlined />}</Button>

                    </Space>
                }
            >
                <SpinTable dataSource={pins} />

            </Drawer>
        </div>
    );
}

export default App;