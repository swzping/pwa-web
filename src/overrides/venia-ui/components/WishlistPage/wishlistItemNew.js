import React, { useEffect, useMemo } from 'react';
import { Trash2 } from 'react-feather';
import { useIntl } from 'react-intl';
import { useToasts } from '@magento/peregrine';
import { useWishlistItem } from '@magento/peregrine/lib/talons/WishlistPage/useWishlistItem';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import Icon from '@magento/venia-ui/lib/components/Icon';
import Image from '@magento/venia-ui/lib/components/Image';
import Price from '@magento/venia-ui/lib/components/Price';

import defaultClasses from './wishlistItemNew.module.css';

const WishlistItem = props => {
    const { item, isAccountInfo } = props;

    const { configurable_options: configurableOptions = [], product } = item;
    const {
        name,
        price_range: priceRange,
        stock_status: stockStatus,
        url_key
    } = product;

    const { maximum_price: maximumPrice } = priceRange;
    const { final_price: finalPrice } = maximumPrice;
    const { currency, value: unitPrice } = finalPrice;

    const talonProps = useWishlistItem(props);
    const {
        addToCartButtonProps,
        handleRemoveProductFromWishlist,
        hasError,
        isRemovalInProgress,
        isSupportedProductType
    } = talonProps;

    const { formatMessage } = useIntl();
    const [, { addToast }] = useToasts();

    useEffect(() => {
        if (hasError) {
            addToast({
                type: 'error',
                message: formatMessage({
                    id: 'wishlistItem.addToCartError',
                    defaultMessage:
                        'Something went wrong. Please refresh and try again.'
                }),
                timeout: 5000
            });
        }
    }, [addToast, formatMessage, hasError]);

    const classes = useStyle(defaultClasses, props.classes);

    const optionElements = useMemo(() => {
        return configurableOptions.map(option => {
            const {
                id,
                option_label: optionLabel,
                value_label: valueLabel
            } = option;

            const optionString = `${optionLabel} : ${valueLabel}`;

            return (
                <span className={classes.option} key={id}>
                    {optionString}
                </span>
            );
        });
    }, [classes.option, configurableOptions]);

    const imageProps = {
        classes: {
            image:
                stockStatus === 'OUT_OF_STOCK'
                    ? classes.image_disabled
                    : classes.image
        },
        ...talonProps.imageProps
    };

    const removeProductAriaLabel = formatMessage({
        id: 'wishlistItem.removeAriaLabel',
        defaultMessage: 'Remove Product from wishlist'
    });

    const rootMixedClasses = isAccountInfo ? classes.root : classes.customRoot;
    const rootMidedDisabled = isAccountInfo
        ? classes.root_disabled
        : classes.customRoot_disabled;

    const rootClass = isRemovalInProgress
        ? rootMidedDisabled
        : rootMixedClasses;

    const addToCart = isSupportedProductType ? (
        <Button className={classes.addToCart} {...addToCartButtonProps}>
            <i className={`${classes.addToCartIcon} icon-white_cart`} />
            Add to Cart
        </Button>
    ) : null;

    return (
        // <div className={rootClass}>
        <div className={classes.item}>
            <svg
                className={classes.deleteItem}
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
            >
                <path
                    d="M15.48 2.25939C13.58 1.67939 11.4 2.12939 10 3.26939C8.6 2.11939 6.41 1.66939 4.52 2.25939C2.31 2.92939 1 4.82939 1 7.34939C1 12.6694 9.14 17.6494 9.48 17.8594C9.64 17.9594 9.82 17.9994 10 17.9994C10.18 17.9994 10.36 17.9494 10.52 17.8594C10.87 17.6494 19 12.6694 19 7.34939C19 4.83939 17.69 2.92939 15.48 2.25939Z"
                    fill="#FF8200"
                />
            </svg>
            <a href={`${url_key}.html`}>
                <div className={classes.imageWrap}>
                    <Image {...imageProps} />
                </div>
                <div className={classes.actionWrap}>
                    <span className={classes.name}>{name}</span>{' '}
                </div>
            </a>
            <div className={classes.priceContainer}>
                <Price currencyCode={currency} value={unitPrice} />
            </div>
            {optionElements}
            {addToCart}

            {isAccountInfo ? (
                <Button
                    className={classes.deleteItemAccount}
                    onClick={handleRemoveProductFromWishlist}
                    aria-label={removeProductAriaLabel}
                >
                    <Icon size={16} src={Trash2} />
                    <span className={classes.removeTextButton}>Remove</span>
                </Button>
            ) : (
                <Button
                    className={classes.deleteItem}
                    onClick={handleRemoveProductFromWishlist}
                    aria-label={removeProductAriaLabel}
                >
                    <Icon size={16} src={Trash2} />
                </Button>
            )}
        </div>
    );
};

export default WishlistItem;
