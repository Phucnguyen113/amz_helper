import { Badge, Button, Drawer, Space, Popconfirm, InputNumber, Spin } from "antd";
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import React, { useEffect, useState, useRef, useMemo } from "react";
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

const xToken = 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJldmVyYmVlLXNzbyIsImlhdCI6MTc0NTk3NTA5OSwiZXhwIjoxNzQ2NTc5ODk5LCJ1c2VyX2lkIjoiMjMwMmYyMTYtMTZkNS00ZjMzLWIzZmMtNDQzNzMwZjMwOTlmIiwiZW1haWwiOiJwaHVjbmd1eWVuMDExM0BnbWFpbC5jb20iLCJ0diI6MSwiaWJwIjpmYWxzZSwiaWJzIjpmYWxzZSwic29zIjpmYWxzZSwiYWN0IjoiMSIsImF1ZCI6IjM3LVVQNHhSNG1aWmFadGVzMjdpNmlKWUJ6UjBYeTBfQzEwZmUtd3QtU0UiLCJzY29wZXMiOltdfQ.kofWvmCO5nlTrb-xH3KVFDAReSRtowDSJhxgDsZGaaj1vltXyqkfS5AGRI1zsV6fS-ai8otzM0DaYTi1S76w9Q';
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
window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('scrollPosition', window.scrollY);
});

const App = () => {
    const [openDrawer, setOpenDrawer] = useState(false);
    const [presetOpen, setPresetOpen] = useState(false);
    const [failedPins, setFailedPins] = useState([]);
    const [itemsSelected, setItemsSelected] = useState(0);
    const [width, setWidthDrawer] = useState(1300);
    const [numberSaved, setNumberSaved] = useChromeStorageLocal("numberSaved", 0);

    const [isRender, setIsRender] = useState(false);
    const visibleIds = useVisibleListings(); // default threshold = 0.5
    const [debouncedVisibleIds, setDebouncedVisibleIds] = useState([]);;

    useEffect(() => {
    const timeout = setTimeout(() => {
        setDebouncedVisibleIds(visibleIds);
    }, 500); // chờ 500ms

    return () => clearTimeout(timeout);
    }, [visibleIds]);

    const {pins, setPins, token, setToken, preset, presetUsed, messageApi} = useAppContext();
    const [trademarks, collections, customs, whitelist, blacklist, niches, ideas] = usePresetGrouped();

    const whitelistRef = useRef(whitelist);

    useEffect(() => {
        const renderPinDetailOrRelatedPin = async () => {
            const elements = document.querySelectorAll('[data-csa-c-item-type="asin"]')

            if (elements.length) {
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i]; // a tag
                    const asin = $(element)?.attr('data-csa-c-item-id')?.split(':')?.[0]?.split('.')?.pop();
                    if (asin) {
                        $(element).attr('data-asin', asin);
                    }
                }
            }
            const productDetailElement = document.querySelector('div#imgTagWrapperId');
            if (productDetailElement) {
                const url = window.location.pathname;
                const match = url.match(/(?<=dp\/)[A-Z0-9]{10}/);
                if (match) {
                    $(productDetailElement).attr('data-asin', match);
                }
            }
        }
        renderPinDetailOrRelatedPin();
    })

    useEffect( () => {
        if (!token || !presetUsed || Object.keys(presetUsed).length == 0) {
            return;
        }
        const renderPinDetailOrRelatedPin = async () => {
            const elements = document.querySelectorAll('[data-csa-c-item-type="asin"]')

            if (elements.length) {
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i]; // a tag
                    const asin = $(element)?.attr('data-csa-c-item-id')?.split(':')?.[0]?.split('.')?.pop();
                    if (asin) {
                        $(element).attr('data-asin', asin);
                    }
                }
            }

            const productDetailElement = document.querySelector('div#imgTagWrapperId');
            if (productDetailElement) {
                const url = window.location.pathname;
                const match = url.match(/(?<=dp\/)[A-Z0-9]{10}/);
                if (match) {
                    $(productDetailElement).attr('data-asin', match);
                }
            }
        }

        // async function processBatch(elements) {
        //     // Lấy tất cả các yêu cầu API
        //     const failPins = [];
        //     for (const element of elements) {
        //         const id = $(element).attr('data-asin');
        //         const data = await fetchPinInfor(id);
        //         console.log('data', id, data);
        //         $(element).attr('data-total-sales', data?.sales30 || 0);

        //         const { typeHightlight, match } = hightlightType(data);
        
        //         data.hightlight = typeHightlight;
        
        //         $(element).removeClass('warning-pin error-pin ok-pin failed-pin');
        //         $(element).addClass(`${typeHightlight}-pin`);
        //         $(element).css('position', 'relative');
        //         $(element).css('display', 'inline-block');
        //         // let rank = '';
        //         // for (let index = 0; index < data?.rank?.length; index++) {
        //         //     const element =  data?.rank[index];
        //         //     rank += decodeURIComponent(element) + '<br>';
        //         // }
        //         //   <div title="total sales count"><i class="fas fa-shopping-cart"></i> ${data?.sales || 0}</div>
        //         //  <div class="sahp-dati" title="Date added ${data?.listedDate || ""}"><i class="saic-date"></i> ${data?.relativeTime}</div>
        //         // <div title="ranking">${rank}</div>
        //         const ButtonWrapper = $(`
        //             <div id="inject-${id}" class="saph-inject-data" style='position:absolute;top: 0; left:0;width: 100%;'>
        //                 <div class="saph-domain">${data?.shopName || "..."}</div>
        //                 <div class="saph-stats">
        //                     <div title="ratings count"><i class="fas fa-star" style="color: #FF9800;"></i> ${data?.reviews || 0} (${data?.everageRating || 0})</div>

        //                     <div title="type">${data?.amz ? 'AMZ' : 'FBA'}</div>
        //                     <div title="reviews"><i class="fas fa-comment"></i> ${data?.reviews || 0}</div>
        //                     <div title="30 days sales count"><i class="fas fa-shopping-cart"></i> ${data?.sales30 || 0}</div>
        //                     ${match ? `<div class="hl-tag">${match}</div>`: ''}
        //                     <div class="sahp-custm" title="Is custom type">Type Custom</div>
        //                 </div>
        //                 <input class="saph-check"  id="checkbox-${id}" data-id="${id}" type="checkbox" ${pinsRef.current.map(pin => pin.id).includes(id) ? 'checked' : ''} />
        //             </div>
        //         `);
        
        //         if ($(`#inject-${id}`).length) {
        //             $(`#inject-${id}`).replaceWith(ButtonWrapper);
        //         } else {
        //             $(element).append(ButtonWrapper);
        //         }
        //         const input = $(`#checkbox-${id}`);
        //         console.log('input ', id, input);
        //         if (input) {
        //             input.attr('data-json', JSON.stringify(data));
        //         }
        //     }
        // }

        async function processBatch(elements, batchSize = 5) {
            const failPins = [];

            for (let i = 0; i < elements.length; i += batchSize) {
                const batch = elements.slice(i, i + batchSize);

                await Promise.all(batch.map(async (element) => {
                    const id = $(element).attr('data-asin');
                    let data = {};
                    try {
                        data = await fetchPinInfor(id);
                    } catch (error) {
                        messageApi.open({
                            type: "error",
                            content: `Maybe your network is interruped or Amz block your request, render checkboxes failed! `,
                            key: "render_failed",
                            duration: 6,
                        });
                        failPins.push(id);
                        return;
                    }
                    const lowPrice = element.querySelectorAll('.a-price span.a-offscreen')?.[0]?.innerHTML;
                    const highPrice = element.querySelectorAll('.a-price span.a-offscreen')?.[1]?.innerHTML;
                    if (lowPrice) {
                        data['lowPrice'] = lowPrice;
                    }
                    
                    if (highPrice) {
                        data['highPrice'] = highPrice;
                    }
                    console.log('data', id, data);

                    $(element).attr('data-total-sales', data?.sales30 || 0);

                    const { typeHightlight, match } = hightlightType(data);
                    data.hightlight = typeHightlight;

                    $(element).removeClass('warning-pin error-pin ok-pin failed-pin');
                    $(element).addClass(`${typeHightlight}-pin`);
                    $(element).css('position', 'relative');
                    $(element).css('display', 'inline-block');

                    const ButtonWrapper = $(`
                        <div id="inject-${id}" class="saph-inject-data" style='position:absolute;top: 0; left:0;width: 100%;'>
                            <div class="saph-domain">${data?.shopName || "..."}</div>
                            <div class="saph-stats">
                                <div title="ratings count"><i class="fas fa-star" style="color: #FF9800;"></i> ${data?.reviews || 0} (${data?.everageRating || 0})</div>
                                <div title="type">${data?.amz ? 'AMZ' : 'FBA'}</div>
                                <div title="reviews"><i class="fas fa-comment"></i> ${data?.reviews || 0}</div>
                                <div title="30 days sales count"><i class="fas fa-shopping-cart"></i> ${data?.sales30 || 0}</div>
                                ${match ? `<div class="hl-tag">${match}</div>` : ''}
                            </div>
                            <input class="saph-check" id="checkbox-${id}" data-id="${id}" type="checkbox" ${pinsRef.current.map(pin => pin.id).includes(id) ? 'checked' : ''} />
                        </div>
                    `);

                    if ($(`#inject-${id}`).length) {
                        $(`#inject-${id}`).replaceWith(ButtonWrapper);
                    } else {
                        $(element).append(ButtonWrapper);
                    }

                    const input = $(`#checkbox-${id}`);
                    if (input) {
                        input.attr('data-json', JSON.stringify(data));
                    }
                }));
            }
            setFailedPins(prev => [...prev, ...failPins]);
        }


        // console.log('re render checkbox', pinsRef.current.map(pin => pin.id))
        const elements = $('div[data-asin]:not(#averageCustomerReviews, [data-card-metrics-id="cross-border-widget_DetailPage_4"],[data-csa-c-content-id="ax-atc-EUIC_AddToCart_Search-content"],[data-marketplace], [data-csa-c-content-id="s-search-add-to-cart-action"], #detailBullets_averageCustomerReviews, [data-csa-c-content-id="s-search-see-details-button"]),span[data-asin], li[data-asin]:not([data-csa-c-content-id="twister-legacy-swatch-swatchAvailable"])').toArray()
        .filter(el => {
            const id = $(el).attr('data-asin');
            return debouncedVisibleIds.includes(id?.toString()); // Kiểm tra xem id có trong visibleIds không
          });
        const render = async () => {
            setIsRender(true);
            await renderPinDetailOrRelatedPin();
            try {
                await processBatch(elements);
            } catch (error) {
                console.log('err', error)
                messageApi.open({
                    type: "error",
                    content: `Maybe your network is interruped or Amz block your request, render checkboxes failed! `,
                    key: "render_failed",
                    duration: 6,
                });
            } finally {
                setIsRender(false);
            }
        }
        if (elements?.length) {
            render();
        }
    }, [debouncedVisibleIds]);

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
        $('.saph-check').each(function (index, element) {
            if ($(this).is(':checked')) {
                $(this).prop('checked', false);
            }
        });
    };

    const checkAllOkPin = async () => {
        const pinIds = [];
        $('.ok-pin,.whitelist-pin').each(function (index, element) {
            const id = $(element).attr('data-asin');
            const totalSales = $(element).attr('data-total-sales');
            if (totalSales >= numberSaved) {
                const checkbox = $(`#checkbox-${id}`);
                if (checkbox && !checkbox.prop('checked')) {
                    checkbox.prop('checked', true);
                    // checkbox.trigger('change');
                    pinIds.push(id);
                }
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
                    // const pinInfo = await fetchPinInfor(pinId);
                   try {
                        const pinInfo = JSON.parse($(`#checkbox-${pinId}`).attr('data-json'));
                        newPins.push({
                            ...pinInfo,
                            ...presetUsed,
                            keyword: s || '',
                            relatedKeyword: rs || ''
                        });
                   } catch (error) {

                   }
                }
            }

            setPins(newPins);
        };

        rebuildPinState();
    }

    // const fetchPinInfor = async (id) => {
    //     function sendMessageAsync(message) {
    //         return new Promise((resolve, reject) => {
    //           chrome.runtime.sendMessage(message, (response) => {
    //             console.log('rrrr', response);
    //             if (response.data) {
    //               resolve(response.data);
    //             } else {
    //               reject(response.error || "Unknown error");
    //             }
    //           });
    //         });
    //     }
    //     const resizeImage = (imageSrc) => {
    //         // let url = imageSrc.replace(/_QL\d+_/, '_')
    //         // .replace(/_FMwebp_/, '_');

    //         // return url.replace(/_AC_(SX\d+)?(_SY\d+)?_/, `_AC_SX1200_`);
    //         const extension = imageSrc.split('.')?.pop() || 'jpg'; 
    //         return (imageSrc?.match(/^(https:\/\/.+?\/[^._]+)/)?.[1] || '') + `._AC_SX1200_.` + extension;
    //     }
    //     const href =`https://www.amazon.com/dp/${id}`
    //     const response =  await axios.get(`${href}?psc=1&from-extension=true`, {
    //         headers: {
    //             'Cache-Control': 'no-cache',
    //             'Pragma': 'no-cache',
    //             'Expires': '0',
    //             'If-None-Match': '',
    //         }
    //     });

    //     const htmlString = response.data;
    //     const parser = new DOMParser();
    //     const doc = parser.parseFromString(htmlString, 'text/html');

    //     const amz = doc.getElementById('merchByAmazonBranding_feature_div')?.querySelector('img') ? true : false;
    //     const images = [];
    //     if (amz) {
    //         let originalPng = doc.getElementById('imgTagWrapperId')?.querySelector('img')?.getAttribute('src');
    //         let png1200 = resizeImage(originalPng || '');
    //         if (png1200) {
    //             images.push(png1200);
    //         }
    //     } else {
    //         try {
    //             const tempImages = Object.keys(JSON.parse(doc?.getElementById('imgTagWrapperId').querySelector('img').getAttribute('data-a-dynamic-image')));
    //             tempImages.map(src => {
    //                 resizeImage(src);
    //                 if (images.length < 4) {
    //                     images.push(resizeImage(src));
    //                 }
    //             });
    //         } catch (error) {
                
    //         }
    //     }
    //     // let description = '';
    //     // doc.querySelector('.a-unordered-list.a-vertical.a-spacing-small')?.querySelectorAll('li span').forEach(e => {
    //     //     if (e.innerHTML) {
    //     //         description+= e.innerHTML + '\n';
    //     //     }
    //     // })
    //     // const regexShop = /Visit the  Store/;
    //     // const regexShop2 = /Brand: (.+?)/;
    //     // const shop = doc?.querySelector('#bylineInfo')?.innerHTML?.match(regexShop)?.[1] || doc?.querySelector('#bylineInfo')?.innerHTML?.match(regexShop2)?.[1];
    //     // const object = {
    //     //     id,
    //     //     title: doc?.querySelector('#productTitle')?.innerHTML?.trim(),
    //     //     url: href,
    //     //     ratings: doc.querySelector('#acrCustomerReviewText')?.innerHTML?.trim() || '0',
    //     //     everageRating: doc.querySelector('#acrPopover')?.querySelector('.a-size-base.a-color-base')?.innerHTML?.trim() || 0,
    //     //     amz,
    //     //     images,
    //     //     description,
    //     //     shopName: shop || doc?.querySelector('#sellerProfileTriggerId')?.innerHTML,
    //     //     cache: response?.cached
    //     // };
    //     // function cleanText(text) {
    //     //     // Loại bỏ HTML entities (như &rlm;, &lrm;)
    //     //     let cleanedText = text.replace(/&[a-zA-Z0-9#]+;/g, '');
        
    //     //     // Loại bỏ dấu ":" và các ký tự không cần thiết khác
    //     //     cleanedText = cleanedText.replace(/[:‏‎]/g, ''); // Loại bỏ dấu ":" và ký tự RLM, LRM
        
    //     //     // Loại bỏ khoảng trắng thừa
    //     //     cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
        
    //     //     return cleanedText;
    //     // }
    //     // for (let index = 0; index < doc.querySelector('#detailBulletsWrapper_feature_div')?.querySelectorAll('.a-list-item')?.length; index++) {
    //     //     const element = doc.querySelector('#detailBulletsWrapper_feature_div')?.querySelectorAll('.a-list-item')[index]
            
    //     //     const title = cleanText(element?.children?.[0]?.innerHTML ?? '');

    //     //     console.log('element', title, id);
    //     //     if (title == 'Date First Available') {
    //     //         const dateIso = (new Date(element?.children?.[1]?.innerHTML)).toISOString().split("T")[0];
    //     //         object['listedDate'] = dateIso;
    //     //         let date = dayjs(dateIso);
    //     //         const relativeTime = date.fromNow(true);
    //     //         object['relativeTime'] = relativeTime;
    //     //     }

    //     //     if (title == 'Best Sellers Rank') {
    //     //         let rank = [];
    //     //         const regex = /\#[0-9]{1,10}/;
    //     //         const match = element?.innerHTML.match(regex);
    //     //         if (match?.[0]) {
    //     //             // object['rank'] = match[0];
    //     //             rank.push(`${match[0]} in our brand`);
    //     //         }
    //     //         element?.querySelectorAll('.a-list-item').forEach(e => {
    //     //             if (e.innerHTML) {
    //     //                 rank.push(encodeURIComponent(e.innerHTML));
    //     //             }
    //     //         });
    //     //         object['rank'] = rank;
    //     //     }

    //     //     if (title == 'ASIN') {
    //     //         object['asin'] = element?.children?.[1]?.innerHTML;
    //     //     }

    //     //     if (title == 'Manufacturer' && !object['shopName'] ) {
    //     //         object['shopName'] = element?.children?.[1]?.innerHTML;
    //     //     }
    //     // }

    //     // for (let index = 0; index < doc?.querySelector('#productDetails_detailBullets_sections1')?.querySelectorAll('tr').length; index++) {
    //     //     const element = doc.querySelector('#productDetails_detailBullets_sections1')?.querySelectorAll('tr')[index];
    //     //     const title = cleanText(element?.querySelector('th')?.innerHTML ?? '');

    //     //     if (title == 'ASIN') {
    //     //         object['asin'] = element?.querySelector('td')?.innerHTML?.trim();
    //     //     }

    //     //     if (title == 'Date First Available') {
    //     //         const dateIso = (new Date(element?.querySelector('td')?.innerHTML)).toISOString().split("T")[0];
    //     //         object['listedDate'] = dateIso;
    //     //         let date = dayjs(dateIso);
    //     //         const relativeTime = date.fromNow(true);
    //     //         object['relativeTime'] = relativeTime;
    //     //     }

    //     //     if (title == 'Best Sellers Rank') {
    //     //         const rank = [];
    //     //         element?.querySelectorAll('td span span')?.forEach(i => {
    //     //             rank.push(encodeURIComponent(i?.innerHTML));
    //     //         });
    //     //         object['rank'] = rank;
    //     //     }
    //     // }
    //     if (id) {
    //         const additionData = await sendMessageAsync({
    //             type: "GET_PROFITGURU_DATA",
    //             asin: id
    //         });

    //         console.log('additionData', additionData);
    //         const object = {
    //             reviews: additionData?.product?.reviews,
    //             sales: additionData?.product?.sales,
    //             sales30: additionData?.product?.sales30,
    //             title: additionData?.product?.name || '',
    //             images: images ? images : [additionData?.product?.img],
    //             everageRating: additionData?.product?.rating,
    //             shopName: additionData?.product?.brandName || '',
    //             amz: additionData?.product?.isSoldByAmz,
    //             id: additionData?.product?.id,
    //             asin: additionData?.product?.asin,
    //         }
    //         return object;
    //     }
    //     return {};
    // }
    const fetchPinInfor = async (id) => {
        if (!id) return {};

        // Helper: Gửi message tới background.js
        const sendMessageAsync = (message) => {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(message, (response) => {
                    if (response?.data) {
                        resolve(response.data);
                    } else {
                        reject(response?.error || "Unknown error");
                    }
                });
            });
        };

        function cleanAmazonImageUrl(url) {
            return url.replace(/_AC(_SX\d+)?_/g, '_AC_SX1200')
            .replace(/SX\d+/g, 'SX1200')
            .replace(/SY\d+/g, 'SY1200');
        }

        const href = `https://www.amazon.com/dp/${id}?psc=1&from-extension=true`;

        const [amazonRes, additionData] = await Promise.all([
            axios.get(href, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'If-None-Match': '',
                }
            }),
            sendMessageAsync({ type: "GET_PROFITGURU_DATA", asin: id })
        ]);

        const htmlString = amazonRes.data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        // Parse hình ảnh từ Amazon
        const amz = !!doc.getElementById('merchByAmazonBranding_feature_div')?.querySelector('img');
        // const amz = additionData?.product?.isSoldByAmz;
        const images = [];

        try {
            if (amz) {
                const originalPng = doc.getElementById('imgTagWrapperId')?.querySelector('img')?.getAttribute('src');
                const png1200 = cleanAmazonImageUrl(originalPng || '');
                if (png1200) images.push(png1200);
            } else {
                // const imageData = doc.querySelectorAll('li.a-spacing-small.item img')
                const imageData = doc.querySelectorAll('.imgTagWrapper img');
                console.log('img',id, doc.querySelectorAll('.imgTagWrapper img'));
                // const tempImages = Object.keys(JSON.parse(imageData || '{}'));
                if (imageData) {
                    for (let i = 0; i < imageData.length; i++) {
                        if (images.length >= 4) break;
                        const src = imageData[i].getAttribute('src') || '';
                        images.push(cleanAmazonImageUrl(src));
                    }
                }
            }
        } catch (err) {
            console.warn('Error parsing Amazon images', err);
        }
        let description = '';
        doc.querySelector('.a-unordered-list.a-vertical.a-spacing-small')?.querySelectorAll('li span').forEach(e => {
            if (e.innerHTML) {
                description+= e.innerHTML + '\n';
            }
        })
        if (!description) {
            doc.querySelector('.a-unordered-list.a-vertical.a-spacing-mini')?.querySelectorAll('li span').forEach(e => {
                if (e.innerHTML) {
                    description+= e.innerHTML + '\n';
                }
            })
        }
        const product = additionData?.product || {};

        return {
            reviews: product?.reviews,
            sales: product?.sales,
            sales30: product?.sales30,
            title: product?.name || '',
            images: images?.length ? images : [product?.img],
            everageRating: product?.rating,
            shopName: product?.brandName || '',
            amz: amz, //product?.isSoldByAmz,
            id: product?.id,
            asin: product?.asin,
            url: `https://www.amazon.com/dp/${id}`,
            lowPrice: product?.lowestPrice ? `$ ${product?.lowestPrice}` : null,
            description,
        };
    };

    const reloadPins = async (pinIds) => {
        const batchSize = 5; // Số lượng tối đa mỗi batch là 5
        const newPins = [...pins]; // Giữ lại bản sao của pins hiện tại

        // Hàm giúp chia pinIds thành các batch nhỏ
        const chunkArray = (arr, size) => {
            const result = [];
            for (let i = 0; i < arr.length; i += size) {
                result.push(arr.slice(i, i + size));
            }
            return result;
        };

        // Chia pinIds thành các batch 5
        const batchedPinIds = chunkArray(pinIds, batchSize);

        try {
            for (const batch of batchedPinIds) {
                const batchResults = await Promise.all(
                    batch.map(async (pinId) => {
                        const pin = pins.find(p => p.id === pinId); // Lấy pin từ danh sách ban đầu
                        if (pin) {
                            const pinItem = await fetchPinInfor(pin.url); // Gọi API lấy thông tin chi tiết của pin
                            return { ...pin, ...pinItem }; // Cập nhật pin với dữ liệu mới
                        }
                        return pin; // Nếu không tìm thấy pin, trả về pin cũ
                    })
                );
                const tempData = batchResults;
    
                const listingIds = tempData.map(i => i.id);
                const response = await axios.post('https://api.everbee.com/etsy_apis/listing', {
                    listing_ids: listingIds
                }, {
                    headers: {
                        'X-Access-Token': xToken
                    }
                });
                const jsonResponse = response.data?.results;

                const listings = tempData.map(function (item) {
                    const listing = jsonResponse.find(i => i.listing_id == item.id);
                    if (listing) {
                        item.views = listing?.views || 0;
                        item.monthSales = listing?.cached_est_mo_sales || 0;
                        item.totalSales = listing?.cached_est_total_sales || 0;
                        item.listingMonths = listing?.cached_listing_age_in_months || 0;
                        item.shopUrl = `https://www.etsy.com/shop/${listing?.shop_name}`
                    }
                    return item;
                });

                // Cập nhật lại pins sau mỗi batch
                listings.forEach((updatedPin) => {
                    const index = newPins.findIndex((pin) => pin.id === updatedPin.id);
                    if (index !== -1) {
                        newPins[index] = updatedPin; // Cập nhật pin sau khi có dữ liệu mới
                    }
                });
            }
        } catch (error) {
            console.log('reload pins failed', )
        }
        console.log('reload', newPins)
        setPins(newPins); // Cập nhật lại toàn bộ danh sách pins
    };

    const showDrawer = () => {
        setOpenDrawer(true);
      };
    
    const closeDrawer = () => {
        setOpenDrawer(false);
    };

    const hightlightType = (pin) => {
        const { type, ratingMin, ratingMax } = presetUsed;

        if (!pin) {
            return { typeHightlight: '', match: '' };
        }

        if (!pin.title) {
            return { typeHightlight: 'warning', match: '' };
        }
    
        // Kiểm tra blacklist
        if (pin.title && blacklist?.length) {
            const match = [];
            for (let index = 0; index < blacklist.length; index++) {
                if (match.length === 2) {
                    break;
                }
                if (pin.title.toLowerCase().includes(blacklist[index])) {
                    match.push(blacklist[index]);
                }
            }
            if (match.length > 0) {
                return { typeHightlight: 'error', match: match.join(', ')};
            }
        }

        // Kiểm tra whitelist
        if (pin.title && whitelist?.length) {
            const match = [];
            for (let index = 0; index < whitelist.length; index++) {
                if (match.length === 2) {
                    break;
                }

                if (pin.title.toLowerCase().includes(whitelist[index])) {
                    match.push(whitelist[index]);
                }
            }
            if (match.length > 0) {
                return { typeHightlight: 'whitelist', match: match.join(', ')};
            }
        }

        if ((pin?.reviews || 0) >= ratingMin && (pin?.reviews || 0) <= ratingMax) {
            if (type === 'all') {
                return {typeHightlight: 'ok', match: ''};
            }

            if (type === 'amz' && pin?.amz) {
                return {typeHightlight: 'ok', match: ''};
            }

            if (type === 'fba' && !pin?.amz) {
                return {typeHightlight: 'ok', match: ''};
            }
        }

        return { typeHightlight: '', match: '' };
    }
    

    //handle checkbox
    useEffect(() => {
        const handleChangeCheckbox = async function (e, index) {
            const pinId = $(e.currentTarget).attr('data-id');
            if (e.currentTarget.checked) {
                const url = new URL(window.location.href);
                const s = url.searchParams.get("q");
                const rs = url.searchParams.get("rs");
                // const pinInfor = await fetchPinInfor(pinId);
                let pinInfor;
                try {
                    pinInfor = JSON.parse($(e.currentTarget).attr('data-json'));
                } catch (error) {
                    console.log('parse error', $(e.currentTarget).attr('data-json'));
                }
                console.log('click', {...pinInfor, ...presetUsed});
                const newPin = {...pinInfor, ...presetUsed, keyword: (s || ''), relatedKeyword: (rs || '')};
                setPins([...pinsRef.current, newPin]);
                // setPins([...pinsRef.current, {...pinInfor, ...presetUsed, keyword: (s || ''), relatedKeyword: (rs || '')}]);
            } else {
                const newPins = [...pinsRef.current].filter(p => p.id !== pinId);
                setPins(newPins);
            }
         };
        $(document).on('change', '.saph-check', handleChangeCheckbox)

        return () => {
            $(document).off('change', '.saph-check', handleChangeCheckbox);
        };
    }, [presetUsed])

    return (
        <div style={{position: 'fixed', bottom: '100px', right: '10px', zIndex: 10}} >
            <div style={{marginBottom: '10px'}}>
                {isRender ? <Spin size="large" /> : null}
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <InputNumber value={numberSaved} onChange={(value) => {setNumberSaved(value)}} step={1} min={0} max={999999} placeholder="Number of Saved" ></InputNumber>
                <Button onClick={checkAllOkPin} size="small">Check All</Button>
                <Preset isOpen={presetOpen} setOpen={setPresetOpen}></Preset>
                <Badge size="small" count={pins.length} style={{marginTop: '10px'}}>
                    <Button style={{padding: '12px 20px'}} type="primary" size="small" onClick={showDrawer}>Spins</Button>
                </Badge>
                <Popconfirm
                    title="Delete all!"
                    description="Are you sure to delete all pin items?"
                    onConfirm={() => clearPins()}
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
                title="Amazon Helper"
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

                            <Settings />
                            <Button onClick={() => setWidthDrawer(width > 1300 ? 1300 : window.innerWidth)}> {width > 1300 ? <FullscreenExitOutlined /> : <FullscreenOutlined />}</Button>
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