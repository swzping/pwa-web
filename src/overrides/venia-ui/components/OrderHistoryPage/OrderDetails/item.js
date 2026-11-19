import React, { useMemo } from 'react';
import { shape, string, number, arrayOf } from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useOrderHistoryContext } from '@magento/peregrine/lib/talons/OrderHistoryPage/orderHistoryContext';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import ProductOptions from '@magento/venia-ui/lib/components/LegacyMiniCart/productOptions';
import Image from '@magento/venia-ui/lib/components/Image';
import Price from '@magento/venia-ui/lib/components/Price';
import defaultClasses from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails/item.module.css';
import PlaceholderImage from '@magento/venia-ui/lib/components/Image/placeholderImage';

const Item = props => {
    const {
        product_name,
        product_sale_price,
        product_url_key,
        quantity_ordered,
        selected_options,
        thumbnail
    } = props;
    const { currency, value: unitPrice } = product_sale_price;

    const orderHistoryState = useOrderHistoryContext();
    const { productURLSuffix } = orderHistoryState;
    const itemLink = `/${product_url_key}${productURLSuffix}`;
    const mappedOptions = useMemo(
        () =>
            selected_options.map(option => ({
                option_label: option.label,
                value_label: option.value
            })),
        [selected_options]
    );
    const classes = useStyle(defaultClasses, props.classes);

    const thumbnailProps = {
        alt: product_name,
        classes: { root: classes.thumbnail },
        width: 50
    };
    const thumbnailElement = thumbnail ? (
        <Image {...thumbnailProps} resource={thumbnail.url} />
    ) : (
        <PlaceholderImage {...thumbnailProps} />
    );

    const customizableOptions =
        props.entered_options && props.entered_options.length > 0 ? (
            <>
                {props.entered_options.map((item, index) => (
                    <div key={index}>
                        <span>
                            <span>
                                {item.label}:
                            </span>
                            {' '}
                            <span>
                                {item.value}
                            </span>

                            {/* {item.values.map(item => item.label).join(', ')} */}
                        </span>
                    </div>
                ))}
            </>
        ) : null;

    const bundleOptions =
        props.bundle_options && props.bundle_options.length > 0 ? (
            <div>
                {props.bundle_options.map((val, idx) => (
                    <div key={idx}>
                        <span>
                            {val.label}
                        </span>{' '}
                        :
                        <div>
                            {val.values.map((item, idt) => (
                                <div style={{ fontSize: '12px' }} key={idt}>
                                    {item.product_name}
                                    {' + '}
                                    <strong>
                                        <Price
                                            currencyCode={currency}
                                            value={item.price.value}
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
            <Link className={classes.thumbnailContainer} to={itemLink}>
                {thumbnailElement}
                {props.is_flash_sale_item && (
                    <img
                        className={classes.flashSaleBadge}
                        src="/venia-static-assets/images/flashProduct.png"
                        alt="Flash Sale"
                    />
                )}
            </Link>
            <div className={classes.nameContainer}>
                <Link to={itemLink}>{product_name}</Link>
            </div>
            {customizableOptions}
            {bundleOptions}
            <ProductOptions
                options={mappedOptions}
                classes={{
                    options: classes.options
                }}
            />
            <span className={classes.quantity}>
                <FormattedMessage
                    id="orderDetails.quantity"
                    defaultMessage="Qty"
                    values={{
                        quantity: quantity_ordered
                    }}
                />
            </span>
            <div className={classes.price}>
                <Price currencyCode={currency} value={unitPrice} />
            </div>
            <Button
                onClick={() => {
                    // TODO will be implemented in PWA-979
                    console.log('Buying Again');
                }}
                className={classes.buyAgainButton}
            >
                <FormattedMessage
                    id="orderDetails.buyAgain"
                    defaultMessage="Buy Again"
                />
            </Button>
        </div>
    );
};

export default Item;

Item.propTypes = {
    classes: shape({
        root: string,
        thumbnailContainer: string,
        thumbnail: string,
        name: string,
        options: string,
        quantity: string,
        price: string,
        buyAgainButton: string
    }),
    product_name: string.isRequired,
    product_sale_price: shape({
        currency: string,
        value: number
    }).isRequired,
    product_url_key: string.isRequired,
    quantity_ordered: number.isRequired,
    selected_options: arrayOf(
        shape({
            label: string,
            value: string
        })
    ).isRequired,
    thumbnail: shape({
        url: string
    })
};
