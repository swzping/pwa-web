import React from 'react';
import { FormattedMessage } from 'react-intl';

import ProductOptions from '@magento/venia-ui/lib/components/LegacyMiniCart/productOptions';
import { useStyle } from '@magento/venia-ui/lib/classify';
import configuredVariant from '@magento/peregrine/lib/util/configuredVariant';
import Price from '@magento/venia-ui/lib/components/Price';

import defaultClasses from './item.module.css';

const Item = props => {
    const {
        classes: propClasses,
        product,
        quantity,
        configurable_options,
        isHidden,
        configurableThumbnailSource,
        custom_price,
        custom_cart_discount
    } = props;

    const classes = useStyle(defaultClasses, propClasses);
    const className = isHidden ? classes.root_hidden : classes.root;
    const bundleClasses = isHidden ? classes.bundleRoot_hidden : classes.bundleRoot;
    const configured_variant = configuredVariant(configurable_options, product);
    const price = product.price_range.maximum_price.final_price;

    const bundleOptions = 
        props.bundle_options && props.bundle_options.length > 0 ? (
            <>
                {props.bundle_options.map((val, idx) => (
                    <div key={idx}>
                        <div style={{ fontWeight: 'bold' }} className={classes.bundleItemName}>{val.label}</div>
                        <>
                            {val.values.map((item, idt) => (
                                <div className="d-flex align-items-center justify-content-between" key={idt}>
                                    <div className={classes.bundleItemName}>{item.label}</div>
                                    <div className={classes.bundleItemName}>
                                        <Price currencyCode={price.currency} value={item.price} />
                                    </div>
                                </div>
                            ))}
                        </>
                    </div>
                ))}
            </>
        ) : null;
    
    if (props.__typename === 'BundleCartItem') {
        return (
            <div className={bundleClasses}>
                <span className={classes.bundleItemName}>{product.name}</span>
                {bundleOptions}
                <div className={classes.bundleItemName}>
                    <FormattedMessage
                        id={'checkoutPage.quantity'}
                        defaultMessage={'x'}
                        values={{ quantity }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className={classes.info}>
                <span className={classes.name}>{product.name}</span>
                <ProductOptions
                    options={configurable_options}
                    classes={{
                        options: classes.options
                    }}
                />
                <span className={classes.quantity}>
                    <FormattedMessage
                        id={'checkoutPage.quantity'}
                        defaultMessage={'x'}
                        values={{ quantity }}
                    />
                </span>
            </div>
            <div className={classes.price}>
                {custom_cart_discount.some(i => i.promo_id === "special_price") ?
                    <div className={classes.specialPrice}>
                        <Price
                            currencyCode={custom_price.row_total.currency}
                            value={custom_price.row_total.value}
                        />
                        {/* <div className={classes.discountWrapper}>
                            <span>Hemat </span>
                            <span className={classes.discountPrice}>
                                <Price
                                    currencyCode={custom_price.row_total.currency}
                                    value={custom_cart_discount && custom_cart_discount.find(x => x.promo_id === "special_price").discount_amount}
                                />
                            </span>
                        </div> */}
                    </div>
                    : <Price currencyCode={custom_price.row_total.currency} value={custom_price.row_total.value} />
                }
            </div>
        </div>
    );
};

export default Item;
