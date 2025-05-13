import { useEffect, useState } from 'react';

export default function useVisibleListings(threshold = 0.5) {
  const [visibleIds, setVisibleIds] = useState([]);

  useEffect(() => {
    const visibleMap = new Map();

    // Tạo observer để theo dõi khi các phần tử mới được thêm vào DOM
    const mutationObserver = new MutationObserver(() => {
      // Lấy tất cả các phần tử sau mỗi mutation (thay đổi DOM)
      const selectors = [
        '[data-asin]',
        '[data-csa-c-item-type="asin"]'
      ];
      const elements = document.querySelectorAll(selectors.join(','));
      
      // Đảm bảo quan sát lại các phần tử mới
      elements.forEach((el) => {
        if (!el.hasAttribute('data-observed')) {
          observer.observe(el);
          el.setAttribute('data-observed', 'true'); // Đánh dấu phần tử đã được quan sát
        }
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;

        entries.forEach((entry) => {
          let id =
            entry.target.getAttribute('data-asin') || (entry.target?.getAttribute('data-csa-c-item-id')?.split(':')?.[0]?.split('.')?.pop());

          if (!id) return;
          if (entry.target.getAttribute('data-asin')) {
            entry.target.setAttribute('data-asin', id);
          }
          if (entry.isIntersecting) {
            if (!visibleMap.has(id)) {
              visibleMap.set(id, true);
              changed = true;
            }
          } else {
            if (visibleMap.has(id)) {
              visibleMap.delete(id);
              changed = true;
            }
          }
        });

        if (changed) {
          const ids = Array.from(visibleMap.keys());
          setVisibleIds(ids);
        }
      },
      {
        root: null,
        threshold,
      }
    );

    // Quan sát lần đầu cho tất cả các phần tử có sẵn
    const selectors = [
      'div[data-listing-id]',
      'a[data-listing-id]',
      'div[data-palette-listing-id][data-component="listing-page-image-carousel"]',
    ];
    const elements = document.querySelectorAll(selectors.join(','));

    // Đánh dấu các phần tử đã được quan sát để không quan sát lại nhiều lần
    elements.forEach((el) => {
      el.setAttribute('data-observed', 'true');
      observer.observe(el);
    });

    // Thêm MutationObserver để theo dõi các thay đổi trong DOM
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect(); // Dừng theo dõi DOM khi component bị hủy
      observer.disconnect(); // Dừng theo dõi các phần tử khi component bị hủy
    };
  }, [threshold]);

  return visibleIds;
}
