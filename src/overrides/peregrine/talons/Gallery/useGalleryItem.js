import { isSupportedProductType as isSupported } from '../../util/isSupportedProductType';
import { productClickTracking } from "../../../../lib/ThirdPartyTracking";
import { trackSkuComponentClick } from '@/utils/track';

export const useGalleryItem = (props = {}) => {
    const { item, onClickQuickviewAction, storeConfig, relativePath, pageView = '' } = props;

    const productType = item ? item.__typename : null;

    const isSupportedProductType = isSupported(productType);

    const handleLinkClick = () => {
        trackSkuComponentClick({...item, locationName: pageView})
        productClickTracking(item, relativePath);
    } 

    const handleQuickviewClick = () => onClickQuickviewAction(item);

    const wishlistButtonProps =
        storeConfig && storeConfig.magento_wishlist_general_is_enabled === '1'
            ? {
                  item,
                  quantity: 1,
                  storeConfig
              }
            : null;

    const compareListButtonProps = { item };

    return { 
        ...props, 
        handleLinkClick, 
        handleQuickviewClick,
        wishlistButtonProps,
        compareListButtonProps, 
        isSupportedProductType 
    };
};
