import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { number, string, shape } from 'prop-types';
import Price from '@magento/venia-ui/lib/components/Price';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './shippingRadio.module.css';

const ShippingRadio = props => {
    const priceElement = props.price ? (
        <Price value={props.price} currencyCode={props.currency} />
    ) : (
        <span>
            <FormattedMessage id={'global.free'} defaultMessage={'FREE'} />
        </span>
    );

    // 显示原价（划线价格）- 只有当原价存在且不等于当前价格时才显示
    const originalPriceElement = props.originalPrice && props.originalPrice !== props.price ? (
        <Price value={props.originalPrice} currencyCode={props.currency} />
    ) : null;

    const classes = useStyle(defaultClasses, props.classes);

    return (
        <div className={classes.container}>
            <div className={classes.name}>
                <span data-cy="ShippingRadio-name">{props.name}</span>
            </div>
            {originalPriceElement && (
                <div className={classes.originalPrice}>
                    {originalPriceElement}
                </div>
            )}
            <div className={classes.price}>{priceElement}</div>
        </div>
    );
};

export default ShippingRadio;

ShippingRadio.propTypes = {
    classes: shape({
        container: string,
        name: string,
        originalPrice: string,
        price: string
    }),
    currency: string.isRequired,
    name: string.isRequired,
    price: number.isRequired,
    originalPrice: number
};
