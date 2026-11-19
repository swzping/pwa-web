import { useEffect, useState } from 'react';
import { getFlashSaleCountdown } from '../modules/swift-pwa-ui/components/Gallery/addToCartModal.flashSale';

// A selected non-sale variant must never inherit its parent's sale status.
export const getCartFlashSaleProduct = item => item?.configured_variant || item?.product;

export const useCartFlashSale = item => {
    const product = getCartFlashSaleProduct(item);
    const [, setTick] = useState(0);
    useEffect(() => {
        if (product?.is_flash_sale !== 1) return;
        const timer = setInterval(() => setTick(value => value + 1), 1000);
        return () => clearInterval(timer);
    }, [product?.is_flash_sale, product?.special_from_date, product?.special_to_date]);

    const countdown = getFlashSaleCountdown(product, Date.now());
    return {
        is_flash_sale: product?.is_flash_sale,
        hours: countdown?.hours || '00',
        minutes: countdown?.minutes || '00',
        seconds: countdown?.seconds || '00',
        isFinished: !countdown
    };
};
