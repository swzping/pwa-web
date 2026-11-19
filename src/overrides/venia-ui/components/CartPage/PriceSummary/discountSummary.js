import React, { Fragment, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useQuery } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import Price from '@magento/venia-ui/lib/components/Price';
import { ChevronDown, ChevronUp } from 'react-feather';
import { GET_SELECTED_AND_AVAILABLE_SHIPPING_METHODS } from '@magento/peregrine/lib/talons/CheckoutPage/ShippingMethod/shippingMethod.gql';

import { useStyle } from '@magento/venia-ui/lib/classify';

const MINUS_SYMBOL = '-';

const DEFAULT_AMOUNT = {
    currency: 'USD',
    value: 0
};

const getDiscountSortOrder = label => {
    if (label === 'Discount Product') return 0;
    if (label === 'Discount Cart') return 2;
    if (label === 'Student Discount') return 3;

    return 1;
};

/**
 * Reduces discounts array into a single amount.
 *
 * @param {Array} discounts
 * @param {Object} deliveryFeeDiscount
 */
const getDiscount = (discounts = [], deliveryFeeDiscount = null) => {
    let productDiscountValue = 0;
    let currency = 'USD';

    // Calculate product discounts
    if (discounts && discounts.length > 0) {
        currency = discounts[0].amount.currency;
        productDiscountValue = discounts.reduce(
            (acc, discount) => acc + discount.amount.value,
            0
        );
    }

    // Add delivery fee discount if available
    let deliveryFeeDiscountValue = 0;
    if (deliveryFeeDiscount && deliveryFeeDiscount.value > 0) {
        deliveryFeeDiscountValue = deliveryFeeDiscount.value;
        currency = deliveryFeeDiscount.currency;
    }

    const totalDiscountValue = productDiscountValue + deliveryFeeDiscountValue;

    return {
        currency,
        value: totalDiscountValue,
        productDiscountValue,
        deliveryFeeDiscountValue
    };
};

/**
 * A component that renders the discount summary line item.
 *
 * @param {Object} props.classes
 * @param {Object} props.data fragment response data
 */
const DiscountSummary = props => {
    const classes = useStyle({}, props.classes);
    const [{ cartId }] = useCartContext();
    const [discountDetail, setDiscountDetail] = useState(true);

    const { data: shippingData } = useQuery(GET_SELECTED_AND_AVAILABLE_SHIPPING_METHODS, {
        fetchPolicy: 'cache-and-network',
        skip: !cartId,
        variables: { cartId }
    });

    // 获取选中的配送方式
    let selectedMethod = null;
    if (shippingData?.cart?.shipping_addresses?.[0]?.selected_shipping_method) {
        selectedMethod = shippingData.cart.shipping_addresses[0].selected_shipping_method;
    }

    // 获取 discount_fee 数据
    const deliveryFeeDiscount = selectedMethod?.discount_fee;

    const discount = getDiscount(props.data, deliveryFeeDiscount);
    const sortedDiscounts = props.data
        ? [...props.data].sort(
            (prev, next) =>
                getDiscountSortOrder(prev.label) -
                getDiscountSortOrder(next.label)
        )
        : [];

    const openDetailDiscount = () => {
        setDiscountDetail(!discountDetail);
    };

    const promotionsList = props.promotions?.map((promotion, index) => (
        <Fragment key={index}>
            <div className={classes.discountTag}>{promotion.label}</div>
            <div className={classes.discountTagPrice}>
                {MINUS_SYMBOL}
                <Price
                    value={promotion.amount.value}
                    currencyCode={promotion.amount.currency}
                />
            </div>
        </Fragment>
    ));


    const discountItems =
        discountDetail && (props.data && props.data.length > 0 || discount.deliveryFeeDiscountValue > 0) ? (
            <>
                {sortedDiscounts.map((item, idx) => {
                    return item.label === 'Discount Cart' ? promotionsList :
                        (
                            <Fragment key={idx}>
                                <span className={classes.discountTag} style={{ backgroundColor: '#ffd38b' }}>
                                    <FormattedMessage
                                        id={`discountSummary.${item.label}`}
                                        defaultMessage={item.label === 'Discount Product' ? 'Product discount' : item.label}
                                    />
                                </span>
                                <span className={classes.discountTagPrice}>
                                    {MINUS_SYMBOL}
                                    <Price
                                        value={item.amount.value}
                                        currencyCode={item.amount.currency}
                                    />
                                </span>
                            </Fragment>
                        )
                })}
                {discount.deliveryFeeDiscountValue > 0 && (
                    <Fragment>
                        <span className={classes.lineItemLabel}>
                            <FormattedMessage
                                id={'deliveryFeeDiscount.lineItemLabel'}
                                defaultMessage={'Delivery Fee Discount'}
                            />
                        </span>
                        <span className={classes.price}>
                            {MINUS_SYMBOL}
                            <Price
                                value={discount.deliveryFeeDiscountValue}
                                currencyCode={discount.currency}
                            />
                        </span>
                    </Fragment>
                )}
            </>
        ) : null;



    return discount.value ? (
        <Fragment>
            {discountItems}
            <span
                // onClick={openDetailDiscount}
                style={{ cursor: 'pointer' }}
                className={classes.lineItemLabel}
            >
                <FormattedMessage
                    id={'discountSummary.lineItemLabel2'}
                    defaultMessage={'Total discount'}
                />{' '}
                {/* {!discountDetail ? (
                    <ChevronDown size={12} />
                ) : (
                    <ChevronUp size={12} />
                )} */}
            </span>
            <span className={classes.price}>
                {MINUS_SYMBOL}
                <Price
                    value={discount.value}
                    currencyCode={discount.currency}
                />
            </span>
        </Fragment>
    ) : null;
};

export default DiscountSummary;
