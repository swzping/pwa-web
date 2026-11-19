import React from 'react';
import { useWindowSize } from '@magento/peregrine';
import { useItemsReview } from '@magento/peregrine/lib/talons/CheckoutPage/ItemsReview/useItemsReview';
import { ChevronDown as ArrowDown, ChevronUp as ArrowUp } from 'react-feather';
import Item from './item';
import ShowAllButton from './showAllButton';
import { useStyle } from '@magento/venia-ui/lib/classify';

import defaultClasses from './itemsReview.module.css';

/**
 * Renders a list of items in an order.
 * @param {Object} props.data an optional static data object to render instead of making a query for data.
 */
const ItemsReview = props => {
    const { classes: propClasses } = props;

    const classes = useStyle(defaultClasses, propClasses);

    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 1024;

    const talonProps = useItemsReview({
        data: props.data
    });

    const {
        items: itemsInCart,
        totalQuantity,
        showAllItems,
        setShowAllItems,
        setHiddenItems,
        isLoading,
        configurableThumbnailSource
    } = talonProps;
    

    const items = itemsInCart.map((item, index) => (
        <Item
            key={item.id}
            {...item}
            isHidden={!showAllItems && !isMobile && index >= 1}
            configurableThumbnailSource={configurableThumbnailSource}
        />
    ));

    const showAllItemsFooter = !showAllItems ? (
        <ShowAllButton
            totalQuantity={totalQuantity}
            icon={ArrowDown}
            onClick={setShowAllItems}
        />
    ) : (
        <ShowAllButton
            totalQuantity={totalQuantity}
            icon={ArrowUp}
            onClick={setHiddenItems}
        />
    );

    if (isLoading) {
        return null;
    }

    return (
        <div>
            {!isMobile ? showAllItemsFooter : null}
            <div className={classes.items_container}>{items}</div>
        </div>
    );
};

export default ItemsReview;
