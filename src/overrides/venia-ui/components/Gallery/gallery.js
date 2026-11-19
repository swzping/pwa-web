import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { string, shape, array } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import GalleryItem from '@magento/venia-ui/lib/components/Gallery/item';
import GalleryItemShimmer from '@magento/venia-ui/lib/components/Gallery/item.shimmer';
import defaultClasses from '@magento/venia-ui/lib/components/Gallery/gallery.module.css';
import { useGallery } from '@magento/peregrine/lib/talons/Gallery/useGallery';
import { trackCommonSkuListExposureView } from '@/utils/track';

import {
    LAYOUT_SWITCHER_DEFAULT_VALUE,
    LAYOUT_SWITCHER_OPTION_LIST
} from '../../../../modules/swift-pwa-ui/components/LayoutSwitcher';
import GalleryItemList from '../../../../modules/swift-pwa-ui/components/Gallery/itemList';
import ProductQuickviewDialog from '../../../../modules/swift-pwa-ui/components/ProductQuickviewDialog';

/**
 * Renders a Gallery of items. If items is an array of nulls Gallery will render
 * a placeholder item for each.
 *
 * @params {Array} props.items an array of items to render
 */
const Gallery = props => {
    const {
        layout = LAYOUT_SWITCHER_DEFAULT_VALUE,
        items,
        relativePath,
        setDataProductAlertMessage = () => {},
        pageView = '',
        setDataProductAlertLoading = () => {},
        onAddToCartSuccess = () => {},
        trackData = {} //新增埋点数据
    } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const history = useHistory();
    const [flashSaleNow, setFlashSaleNow] = useState(Date.now);
    const flashSaleItems = items.filter(item => item?.is_flash_sale === 1);
    const hasFlashSale = flashSaleItems.length > 0;
    // A single expired product (or a global flag from another page) does not
    // mean the entire list's Flash Sale has ended.
    const hasEndedFlashSale = hasFlashSale && flashSaleItems.every(item => {
        if (typeof item.special_to_date !== 'string' || !item.special_to_date.trim()) return false;
        // Promotion dates without an explicit timezone are UTC.
        const date = item.special_to_date.trim().replace(' ', 'T');
        const endTime = Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(date) ? date : `${date}Z`);
        return Number.isFinite(endTime) && flashSaleNow >= endTime;
    });

    useEffect(() => {
        if (!hasFlashSale) return;
        setFlashSaleNow(Date.now());
        const timer = setInterval(() => setFlashSaleNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [hasFlashSale]);
    const talonProps = useGallery();
    const trackedSkuRef = useRef(null);
    const exposedSkuSet = useRef(new Set());
    const elementItemMap = useRef(new WeakMap());


    const {
        handleQuickviewClose,
        handleQuickviewOpen,
        isOpenQuickview,
        quickviewDataUrlKey,
        storeConfig,
    } = talonProps;

    let ItemComponent = GalleryItem;
    let itemsClasses = classes.items;

    switch (layout) {
        case LAYOUT_SWITCHER_OPTION_LIST:
            itemsClasses = classes.items_list;
            ItemComponent = GalleryItemList;
            break;

        default:
            itemsClasses = classes.items;
            ItemComponent = GalleryItem;
            break;
    }

    // 监听商品列表曝光
    useEffect(() => {
        trackedSkuRef.current = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const item = elementItemMap.current.get(entry.target);
                if (!item) continue;
                if (exposedSkuSet.current.has(item.id)) continue;
                exposedSkuSet.current.add(item.id);
                trackCommonSkuListExposureView({...item, ...trackData});
                trackedSkuRef.current.unobserve(entry.target);
            }
        });
        return () => trackedSkuRef.current?.disconnect();
    }, []);

    const registerObserver = useCallback((element, item) => {
        if (!element || !trackedSkuRef.current) return;
        elementItemMap.current.set(element, item);
        trackedSkuRef.current.observe(element);
    }, []);


    const galleryItems = useMemo(
        () =>
            items.map((item, index) => {
                if (item === null) {
                    return <GalleryItemShimmer key={index} />;
                }

                return (
                    <ItemComponent
                        itemGalleryRef={el => registerObserver(el, item)}
                        key={item.id}
                        item={item}
                        relativePath={relativePath}
                        storeConfig={storeConfig}
                        onClickQuickviewAction={handleQuickviewOpen}
                        setDataProductAlertMessage={setDataProductAlertMessage}
                        setDataProductAlertLoading={setDataProductAlertLoading}
                        pageView={pageView}
                        onAddToCartSuccess={onAddToCartSuccess}
                    />
                );
            }),
        [layout, items, storeConfig]
    );

    const maybeQuickviewDialog = useMemo(() => {
        if (isOpenQuickview) {
            return (
                <ProductQuickviewDialog
                    storeConfig={storeConfig}
                    urlKey={quickviewDataUrlKey}
                    onClose={handleQuickviewClose}
                />
            );
        }

        return null;
    }, [
        isOpenQuickview,
        quickviewDataUrlKey,
        handleQuickviewClose,
    ]);

    useEffect(() => {
        return () => {
            localStorage.setItem('listPageReloaded', '')
        }
    }, [])

    return (
        <div className={classes.root} aria-live="polite" aria-busy="false">
            { location.pathname !== '/search.html' && !localStorage.getItem('listPageReloaded') && hasEndedFlashSale && <div className={classes.mask}>
                        <div className={classes.maskContent}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#212121' }}>Flash sales have ended</span>
                    <p className={classes.maskContentText}>Current flash sales items will return to their original prices！</p>
                    <div className={classes.sureBtn} onClick={() => {
                        if(location.pathname == '/search.html') {
                           location.reload()
                           localStorage.setItem('listPageReloaded', true)
                                    } else {
                                        history.push('/');
                                    }
                    }}>OK</div>
            </div>
            </div>}
            <div className={itemsClasses}>{galleryItems}</div>
            {maybeQuickviewDialog}
        </div>
    );
};

Gallery.propTypes = {
    classes: shape({
        filters: string,
        items: string,
        pagination: string,
        root: string
    }),
    items: array.isRequired
};

export default Gallery;
