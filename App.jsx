import { Badge, Button, Drawer, Space, Popconfirm } from "antd";
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import React, { useEffect, useState, useRef } from "react";
import $, { ready } from "jquery";
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
import useVisibleListings from "./utils/visibleListings";

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
    const visibleIds = useVisibleListings(); // default threshold = 0.5

    const {pins, setPins, token, setToken, preset, presetUsed} = useAppContext();
    const [trademarks, collections, customs, whitelist, blacklist, niches, ideas] = usePresetGrouped();

    const whitelistRef = useRef(whitelist);

    useEffect( () => {
        const renderPinDetailOrRelatedPin = async () => {
            const element = document.querySelector('div[data-palette-listing-id][data-component=listing-page-image-carousel]');
            if (element) {
                const id  = element.getAttribute('data-palette-listing-id');
                if (id) {
                    $(element).attr('data-listing-id', id);

                }
            }

            const element2 = document.querySelectorAll('li[data-clg-id="WtListItem"] a');
            if (element2.length) {
                for (let i = 0; i < element2.length; i++) {
                    const element = element2[i]; // a tag
                    const href = $(element).attr('href');
                    const match = href.match(/\/listing\/(\d+)/);
                    if (match) {
                        const listingId = match[1];
                        $(element).attr('data-listing-id', listingId);
                    }
                }
                const likeButtons = document.getElementsByClassName('implicit-comparison-favorite-button wt-position-absolute wt-position-top wt-position-right');

                for (let i = 0; i < likeButtons.length; i++) {
                    const element = likeButtons[i];
                    element.remove();
                }
            }
        }

        const likeButtons = document.getElementsByClassName('v2-listing-card__actions wt-z-index-1 wt-position-absolute');
        for (let i = 0; i < likeButtons.length; i++) {
            const element = likeButtons[i];
            element.remove();
        }

        async function processBatch(elements) {
            // Lấy tất cả các yêu cầu API
            const promises = elements.map(async (element) => {
                let href;
                if ($(element).is('div')) {
                    href = window.location.href;
                } else if ($(element).is('a')) {
                    href = $(element).attr('href');
                }

                // Call API để lấy dữ liệu
                const data = await fetchPinInfor(href);
                return data;
            });

            // Chờ tất cả các yêu cầu hoàn thành
            const tempData = await Promise.all(promises);

            // Lấy tất cả các ID và gọi API để lấy thông tin listing
            const listingIds = tempData.map(i => i.id);
            const response = await axios.post('https://api.everbee.com/etsy_apis/listing', {
                listing_ids: listingIds
            }, {
                headers: {
                    'X-Access-Token': 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJldmVyYmVlLXNzbyIsImlhdCI6MTc0NTIyMTEwOSwiZXhwIjoxNzQ1ODI1OTA5LCJ1c2VyX2lkIjoiMjMwMmYyMTYtMTZkNS00ZjMzLWIzZmMtNDQzNzMwZjMwOTlmIiwiZW1haWwiOiJwaHVjbmd1eWVuMDExM0BnbWFpbC5jb20iLCJ0diI6MSwiaWJwIjpmYWxzZSwiaWJzIjpmYWxzZSwic29zIjpmYWxzZSwiYWN0IjoiMSIsImF1ZCI6IjM3LVVQNHhSNG1aWmFadGVzMjdpNmlKWUJ6UjBYeTBfQzEwZmUtd3QtU0UiLCJzY29wZXMiOltdfQ.Ja030YkFBPj24KvEiBScnh2ILMsnx5fBzHkyWFw8Jt6Hk-iuNOO7AJCzJaMBN8i2AOkStR3f3pIQPKli1Nuc0Q'
                }
            });

            // Xử lý dữ liệu trả về từ API
            const jsonResponse = response.data?.results;

            // Cập nhật thông tin cho tempData
            const listings = tempData.map(function (item) {
                const listing = jsonResponse.find(i => i.listing_id == item.id);
                if (listing) {
                    item.views = listing?.views || 0;
                    item.monthSales = listing?.cached_est_mo_sales || 0;
                    item.totalSales = listing?.cached_est_total_sales || 0;
                    item.listingMonths = listing?.cached_listing_age_in_months || 0;
                }
                return item;
            });

            // Cập nhật giao diện
            elements.forEach((element) => {
                const id = $(element).attr('data-listing-id');
                const data = listings.find(i => i.id == id);
                const typeHightlight = hightlightType(data);
                data.hightlight = typeHightlight;

                $(element).removeClass('warning-pin error-pin ok-pin');
                $(element).addClass(`${typeHightlight}-pin`);

                const ButtonWrapper = $(`
                    <div id="inject-${id}" class="saph-inject-data">
                        <div class="saph-domain">${data?.shopName || "..."}</div>
                        <div class="saph-stats">
                            <div title="saved count"><i class="saic-saved"></i>  ${data?.reviews || 0}</div>
                            <div title="reaction count"><i class="saic-reaction"></i> ${data?.favorites || 0}</div>
                            <div title="repin count"><i class="saic-repin"></i> ${data?.monthSales || 0}</div>
                            <div title="share count"><i class="saic-share"></i> ${data?.totalSales || 0}</div>
                            <div class="sahp-dati" title="Date added ${data?.listedDate || ""}"><i class="saic-date"></i> ${data?.relativeTime}</div>
                            <div class="sahp-custm" title="Is custom type">Type Custom</div>
                        </div>
                        <input class="saph-check" id="checkbox-${id}" data-id="${id}" type="checkbox" ${pinsRef.current.map(pin => pin.id).includes(id) ? 'checked' : ''} />
                    </div>
                `);
                if ($(`#inject-${id}`).length) {
                    $(`#inject-${id}`).replaceWith(ButtonWrapper);
                } else {
                    $(element).append(ButtonWrapper);
                }
            });

            return tempData;
        }

        // console.log('re render checkbox', pinsRef.current.map(pin => pin.id))
        const elements = $('a[data-listing-id], div[data-palette-listing-id][data-component=listing-page-image-carousel]').toArray()
        .filter(el => {
            const id = $(el).data('listing-id');

            return visibleIds.includes(id.toString()); // Kiểm tra xem id có trong visibleIds không
          });

        const render = async () => {
            await renderPinDetailOrRelatedPin();
            await processBatch(elements);
        }
        if (elements?.length) {
            render();
        }
    }, [visibleIds]);

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

    const checkAllOkPin = async () => {
        const pinIds = [];
        $('.ok-pin').each(function (index, element) {
            const id = $(element).attr('data-test-pin-id');
            const checkbox = $(`#checkbox-${id}`);
            if (checkbox && !checkbox.prop('checked')) {
                checkbox.prop('checked', true);
                // checkbox.trigger('change');
                pinIds.push(id);
            }
        });
        const rebuildPinState = async () => {
            const url = new URL(window.location.href);
            const s = url.searchParams.get("q");
            const rs = url.searchParams.get("rs");

            const newPins = [...pins];

            for (let i = 0; i < pinIds.length; i++) {
                const pinId = pinIds[i];
                if (pinId && !newPins.find(i => i.id == pinId)) {
                    const pinInfo = await fetchPinInfor(pinId);
                    newPins.push({
                        ...pinInfo,
                        ...presetUsed,
                        keyword: s || '',
                        relatedKeyword: rs || ''
                    });
                }
            }

            setPins(newPins);
        };

        rebuildPinState();
    }

    const fetchPinInfor = async (href) => {
        const cleanUrl = href.split('?')[0];
        const CancelToken = axios.CancelToken;

        const response =  await axios.get(`${cleanUrl}?from-extension=true`);

        const htmlString = response.data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        const scripts = doc.querySelectorAll('script');
        const ldJsonScript = Array.from(scripts).find(script => script.type === 'application/ld+json');
        if (ldJsonScript) {
            // console.log('ldJsonScript', ldJsonScript.textContent);
            const pinInfo = JSON.parse(ldJsonScript.textContent);
            let images = [];
            try {
                images = pinInfo?.image?.slice(0, 4)?.map(i => i?.contentURL) || [];
            } catch (error) {
                if (typeof pinInfo?.image === 'string') {
                    images.push(pinInfo?.image);
                }
            }
            const reviews = doc.getElementById('same-listing-reviews-tab')?.querySelector('span')?.innerHTML?.replace(/\D/g, '') || 0;
            const favoritesAndListedDateDOM = doc.getElementsByClassName('wt-display-flex-xs wt-align-items-center wt-flex-direction-row-lg wt-flex-direction-column-xs')?.[0];
            let listedDate;
            let relativeTime;
            let favorites;
            if (favoritesAndListedDateDOM) {
                favorites = favoritesAndListedDateDOM?.querySelector('a')?.innerHTML?.replace(/\D/g, '');
                const rawDate = favoritesAndListedDateDOM?.querySelector('div.wt-pr-xs-2.wt-text-caption')?.innerHTML;
                const dateMatch = (rawDate || '').match(/Listed on (\w{3} \d{1,2}, \d{4})/);
                // console.log('favoritesAndListedDateDOM', dateMatch, rawDate);

                if (dateMatch?.[1]) {
                    let sd = (new Date(dateMatch[1])).toISOString().split("T")[0];
                    let date = dayjs(sd);
                    relativeTime = date.fromNow(true);
                    listedDate = sd;
                }
            }

            return {
                url: cleanUrl,
                id: pinInfo?.sku,
                title: pinInfo?.name,
                highPrice:pinInfo?.highPrice,
                lowPrice: pinInfo?.lowPrice,
                listedDate,
                relativeTime,
                favorites,
                shopName: pinInfo?.brand?.name,
                reviews,
                images
            }
        }
        console.log('Oops', href, scripts);
        return {};

        // Draw from DOM
        // const carousels = doc.querySelectorAll('li.carousel-pane')
        // const images = [];
        // for (let i = 0; i < (carousels.length <= 4 ? carousels.length : 4); i++) {
        //     const element = carousels[i];
        //     const img = element.querySelector('img');
        //     if (img) {
        //         images.push(img.getAttribute('src'));
        //     }
        // }

        // const priceContent = doc.querySelector('div[data-selector="price-only"]')?.querySelector('p').innerHTML || '';

        // const priceMax = doc.querySelector('div[data-selector="price-only"]').querySelector('.wt-text-strikethrough').innerHTML?.replace(/[^\d,]/g, '') || 0;
        // const price = priceContent.replace(/<.*?>/g, '')?.trim()?.replace(/[^\d,]/g, '');
        // const title = doc.querySelector('h1[data-buy-box-listing-title="true"]')?.innerHTML?.replace(/\n/g, '').trim();
        // const reviews = doc.getElementById('same-listing-reviews-tab')?.querySelector('span')?.innerHTML?.replace(/\D/g, '') || 0;
        // const shopName = doc.getElementById('shop_owners_content_toggle')?.querySelector('.wt-text-heading-small.wt-line-height-tight.wt-mb-lg-1')?.innerHTML || '';

        // const favoritesAndListedDateDOM = doc.getElementsByClassName('wt-display-flex-xs wt-align-items-center wt-flex-direction-row-lg wt-flex-direction-column-xs')?.[0];
        // let listedDate;
        // let relativeTime;
        // let favorites;
        // if (favoritesAndListedDateDOM) {
        //     favorites = favoritesAndListedDateDOM?.querySelector('a')?.innerHTML?.replace(/\D/g, '');
        //     const rawDate = favoritesAndListedDateDOM?.querySelector('div.wt-pr-xs-2.wt-text-caption')?.innerHTML;
        //     const dateMatch = (rawDate || '').match(/Listed on (\w{3} \d{1,2}, \d{4})/);
        //     // console.log('favoritesAndListedDateDOM', dateMatch, rawDate);

        //     if (dateMatch?.[1]) {
        //         let sd = (new Date(dateMatch[1])).toISOString().split("T")[0];
        //         let date = dayjs(sd);
        //         relativeTime = date.fromNow(true);
        //         listedDate = sd;
        //     }
        // }
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
        if (!pin) {
            return;
        }

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
        if (pin?.listedDate) {
            let sd = pin?.listedDate;
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

    useEffect(() => {

    }, [])
    //handle checkbox
    useEffect(() => {
        const handleChangeCheckbox = async function (e, index) {
            const pinId = $(e.currentTarget).attr('data-id');
            console.log('change', pinId, pins);
            if (e.currentTarget.checked) {
                const url = new URL(window.location.href);
                const s = url.searchParams.get("q");
                const rs = url.searchParams.get("rs");
                const pinInfor = await fetchPinInfor(pinId);
                console.log('click', {...pinInfor, ...presetUsed});
                const newPin = {...pinInfor, ...presetUsed, keyword: (s || ''), relatedKeyword: (rs || '')};
                setPins([...pinsRef.current, newPin]);
                // setPins([...pinsRef.current, {...pinInfor, ...presetUsed, keyword: (s || ''), relatedKeyword: (rs || '')}]);
            } else {
                setPins(prev => prev.filter(p => p.id !== pinId));
            }
         };
        $(document).on('change', '.saph-check', handleChangeCheckbox)

        return () => {
            $(document).off('change', '.saph-check', handleChangeCheckbox);
        };
    }, [presetUsed])

    return (
        <div style={{position: 'fixed', bottom: '100px', right: '10px'}} >
            {/* <div>visibleIds:  {visibleIds.join(', ')}</div> */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <Button onClick={checkAllOkPin} size="small">Check All</Button>
                <Preset isOpen={presetOpen} setOpen={setPresetOpen}></Preset>
                <Badge size="small" count={pins.length} style={{marginTop: '10px'}}>
                    <Button style={{padding: '12px 20px'}} type="primary" size="small" onClick={showDrawer}>Spins</Button>
                </Badge>
                <Popconfirm
                    title="Delete all!"
                    description="Are you sure to delete all pin items?"
                    onConfirm={() => setPins([])}
                    onCancel={() => { }}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button size="small" type="primary" danger>
                        Remove All
                    </Button>
                </Popconfirm>
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
                                    if (token) {
                                        setPresetOpen(true);
                                    }

                                    setOpenDrawer(false);
                                }}
                                >
                                Preset
                            </Button>
                            
                            {/* <Button onClick={() => clearPins()}> ClearPin</Button> */}
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