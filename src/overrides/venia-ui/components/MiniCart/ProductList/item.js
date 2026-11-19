import React, { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { string, number, shape, func, arrayOf, oneOf } from 'prop-types';
import { Trash2 as DeleteIcon } from 'react-feather';
import { Link } from 'react-router-dom';

import Price from '@magento/venia-ui/lib/components/Price';
import { useItem } from '@magento/peregrine/lib/talons/MiniCart/useItem';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import configuredVariant from '@magento/peregrine/lib/util/configuredVariant';

import { useStyle } from '@magento/venia-ui/lib/classify';
import ProductOptions from '@magento/venia-ui/lib/components/LegacyMiniCart/productOptions';
import Image from '@magento/venia-ui/lib/components/Image';
import Icon from '@magento/venia-ui/lib/components/Icon';
import AddToCart from '../../../../../modules/swift-pwa-ui/components/Gallery/addToCart';
import { TrashOutlined } from '@/assets/icons'
import defaultClasses from './item.module.css';

const Item = props => {
    const {
        classes: propClasses,
        product,
        id,
        quantity,
        configurable_options,
        customizable_options,
        bundle_options,
        handleRemoveItem,
        prices,
        custom_price,
        closeMiniCart,
        configurableThumbnailSource,
        custom_cart_discount,
        // itemDiscount,
        // loadingDiscount,
    } = props;

    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses, propClasses);
    const itemLink = useMemo(
        () => resourceUrl(`/${product.url_key}${product.url_suffix || ''}`),
        [product.url_key, product.url_suffix]
    );

    const { isDeleting, removeItem } = useItem({
        id,
        product,
        custom_price,
        quantity,
        handleRemoveItem
    });

    const configured_variant = configuredVariant(configurable_options, product);

    const customizableOptions =
        customizable_options && customizable_options.length > 0 ? (
            <div className={classes.customizable}>
                {customizable_options.map((item, index) => (
                    <span key={index}>
                        <span className={classes.customizableTitle}>
                            {item.label}:
                        </span>{' '}
                        {item.values.map(item => item.label).join(', ')}
                    </span>
                ))}
            </div>
        ) : null;

    const bundleOptions =
        bundle_options && bundle_options.length > 0 ? (
            <div className={classes.customizable}>
                {bundle_options.map((val, idx) => (
                    <div key={idx}>
                        <span className={classes.customizableTitle}>{val.label}</span>
                        {' '}
                        :
                        <div>
                            {val.values.map((item, idt) => (
                                <div style={{ fontSize: '12px' }} key={idt}>
                                    {/* {item.quantity} */}
                                    {item.label}
                                    {' + '}
                                        <strong>
                                            <Price
                                                currencyCode={custom_price && custom_price.row_total && custom_price.row_total.currency}
                                                value={item.price}
                                            />
                                        </strong>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : null;

    return (
        <div className={classes.root}>
            {isDeleting ?
                <div className={classes.removeLoader}>
                    <span className={classes.loader}></span>
                    <span className={classes.loaderText}>Remove Item...</span>
                </div>
                : null
            }
            <Link
                className={classes.thumbnailContainer}
                to={itemLink}
                onClick={closeMiniCart}
            >
                <Image
                    alt={product.name}
                    classes={{
                        root: classes.thumbnail
                    }}
                    width={100}
                    resource={
                        configurableThumbnailSource === 'itself' &&
                        configured_variant
                            ? configured_variant.thumbnail.url
                            : product.thumbnail.url
                    }
                />
                {product.promo && (
                    <div className={classes.productPromo}>{product.promo}</div>
                )}
            </Link>
            <Link
                className={classes.name}
                to={itemLink}
                onClick={closeMiniCart}
            >
                {product.name}
            </Link>
            <span className={classes.price}>
                {custom_cart_discount && custom_cart_discount.some(i => i.promo_id === "special_price") ?
                    <div className={`${classes.priceWrapper} ${classes.specialPrice}`}>
                        <Price
                            currencyCode={custom_price && custom_price.row_total && custom_price.row_total.currency}
                            value={custom_price.row_total.value}
                        />
                        <div className={classes.discountWrapper}>
                            <span className={classes.discountPrice}>
                                <Price
                                    currencyCode={custom_price && custom_price.row_total && custom_price.row_total.currency}
                                    value={custom_cart_discount && custom_cart_discount.find(x => x.promo_id === "special_price").discount_amount}
                                />
                            </span>
                        </div>
                    </div>
                    : <div className={classes.priceWrapper}>
                        <Price
                            currencyCode={custom_price && custom_price.row_total && custom_price.row_total.currency}
                            value={custom_price && custom_price.row_total && custom_price.row_total.value}
                        />
                    </div>
                }
                {/* <FormattedMessage
                    id={'productList.each'}
                    defaultMessage={' ea.'}
                /> */}
            </span>
            <ProductOptions
                options={configurable_options}
                classes={{
                    options: classes.options
                }}
            />
            {customizableOptions}
            {bundleOptions}
            <span className={classes.quantity}>
                <FormattedMessage
                    id={'productList.quantity'}
                    defaultMessage={'Qty :'}
                    values={{ quantity }}
                />
            </span>
            {product.stock_status === 'OUT_OF_STOCK' ?
                <div className={classes.stockStatus}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                    </svg>
                    <span>Out of stock</span>
                </div>
                : null
            }
            {product.stock_item.salable_qty < quantity && product.stock_item.salable_qty != 0 ?
                <div className={classes.qtyStatus}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                    </svg>
                    <span>Unavailable Qty</span>
                </div>
                : null
            }
            <button
                onClick={removeItem}
                type="button"
                className={classes.deleteButton}
                disabled={isDeleting}
            >
                <Icon src={TrashOutlined} size={24} />
            </button>
        </div>
    );
};

export default Item;

Item.propTypes = {
    classes: shape({
        root: string,
        thumbnail: string,
        name: string,
        options: string,
        quantity: string,
        price: string,
        editButton: string,
        editIcon: string
    }),
    product: shape({
        name: string,
        thumbnail: shape({
            url: string
        })
    }),
    id: string,
    quantity: number,
    configurable_options: arrayOf(
        shape({
            id: number,
            option_label: string,
            value_id: number,
            value_label: string
        })
    ),
    handleRemoveItem: func,
    prices: shape({
        price: shape({
            value: number,
            currency: string
        })
    }),
    configured_variant: shape({
        thumbnail: shape({
            url: string
        })
    }),
    configurableThumbnailSource: oneOf(['parent', 'itself'])
};
