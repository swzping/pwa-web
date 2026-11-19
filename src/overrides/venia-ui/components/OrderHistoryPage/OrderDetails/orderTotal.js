import React, { useMemo } from 'react';
import { arrayOf, string, shape, number } from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Price from '@magento/venia-ui/lib/components/Price';
import { useStyle } from '@magento/venia-ui/lib/classify';

import defaultClasses from './orderTotal.module.css';
const MINUS_SYMBOL = '-';
const OrderTotal = props => {
    const { classes: propClasses, data, detail, promotions } = props;
    const {
        discounts,
        grand_total,
        subtotal,
        total_tax,
        total_shipping,
        total_tp_discount,
        student_discount,
        loyalty_points
    } = data;
    const classes = useStyle(defaultClasses, propClasses);

    const discountRowElement = useMemo(() => {
        if (!discounts || !discounts.length) {
            return null;
        }

        const discountTotal = {
            currency: discounts[0].amount.currency,
            value: discounts.reduce(
                (acc, discount) => acc + discount.amount.value,
                0
            )
        };

        return (
            <div className={classes.discount}>
                <span className={classes.discountTag}>
                    <FormattedMessage
                        id="orderDetails.discount"
                        defaultMessage="Discount"
                    />
                </span>
                <span className={classes.discountTagPrice}>
                    <Price
                        value={discountTotal.value}
                        currencyCode={discountTotal.currency}
                    />
                </span>
            </div>
        );
    }, [classes.discount, discounts]);

    const promotionsList = promotions?.map((promotion, index) => (
        <div key={index} className={classes.discount}>
            <span className={classes.discountTag}>{promotion.label}</span>
            <span className={classes.discountTagPrice}>
                {MINUS_SYMBOL}
                <Price
                    value={promotion.amount.value}
                    currencyCode={promotion.amount.currency}
                />
            </span>
        </div>
    ));

    const studentPassTag = (
        <div className={`${classes.priceSummary} d-flex justify-content-between align-items-center`}>
            <p className={[classes.discountTag].join(' ')} style={{ backgroundColor: '#ffd38b' }}>student</p>
            <p className={[classes.discountTagPrice].join(' ')}>
                {MINUS_SYMBOL}
                <Price
                    value={student_discount.value || '0'}
                    currencyCode={student_discount.currency || 'IDR'}
                />
            </p>
        </div>
    )


    return (
        <div className={classes.root}>
            {/* <div className={classes.heading}>
                <FormattedMessage
                    id="orderDetails.orderTotal"
                    defaultMessage="Order Total"
                />
            </div> */}
            <div className={classes.subTotal}>
                <span>
                    <FormattedMessage
                        id="orderDetails.subtotal"
                        defaultMessage="Subtotal"
                    />
                </span>
                <span>
                    <Price
                        value={subtotal.value}
                        currencyCode={subtotal.currency}
                    />
                </span>
            </div>
            {/* {discountRowElement} */}
            {
                (total_tax && total_tax.value > 0) && (
                    <div className={classes.tax}>
                        <span>
                            <FormattedMessage
                                id="orderDetails.tax"
                                defaultMessage="Tax"
                            />
                        </span>
                        <span>
                            <Price
                                value={total_tax.value}
                                currencyCode={total_tax.currency}
                            />
                        </span>
                    </div>
                )
            }
            <div className={classes.shipping}>
                <span>
                    <FormattedMessage
                        id="orderDetails.shipping"
                        defaultMessage="Shipping"
                    />
                </span>
                <span>
                    <Price
                        value={total_shipping.value}
                        currencyCode={total_shipping.currency}
                    />
                </span>
            </div>
            {!!total_tp_discount?.value && (
                <div className={classes.productDiscount}>
                    <span>
                        <FormattedMessage
                            id="orderDetails.productDiscount"
                            defaultMessage="Product Discount"
                        />
                    </span>
                    <span className={classes.productDiscountPrice}>
                        {MINUS_SYMBOL}
                        <Price
                            value={total_tp_discount.value}
                            currencyCode={total_tp_discount.currency}
                        />
                    </span>
                </div>
            )}
            {promotionsList}
            {student_discount.value ? studentPassTag : null}

            {detail ? (
                <>
                    {detail.map((item, index) => {
                        const {
                            aw_giftcard,
                            aw_reward_points,
                            aw_store_credit,
                            discount_amount
                        } = item;

                        return (
                            <React.Fragment key={index}>
                                {discount_amount > 0 && (
                                    <div
                                        className={classes.subTotal}
                                    >
                                        <span>Discount</span>
                                        <span>
                                            -
                                            <Price
                                                currencyCode={
                                                    subtotal.currency
                                                }
                                                value={
                                                    discount_amount || 0
                                                }
                                            />
                                        </span>
                                    </div>
                                )}
                                {aw_giftcard.giftcard_amount && (
                                    <div
                                        className={classes.subTotal}
                                    >
                                        <span>Gift Card</span>
                                        <span>
                                            -
                                            <Price
                                                currencyCode={
                                                    subtotal.currency
                                                }
                                                value={
                                                    aw_giftcard.giftcard_amount ||
                                                    0
                                                }
                                            />
                                        </span>
                                    </div>
                                )}
                                {aw_reward_points.reward_points_amount && (
                                    <div
                                        className={classes.subTotal}
                                    >
                                        <span>Reward Point</span>
                                        <span>
                                            <Price
                                                currencyCode={
                                                    subtotal.currency
                                                }
                                                value={
                                                    aw_reward_points.reward_points_amount ||
                                                    0
                                                }
                                            />
                                        </span>
                                    </div>
                                )}
                                {aw_store_credit.store_credit_amount && (
                                    <div
                                        className={classes.subTotal}
                                    >
                                        <span>Store Credit</span>
                                        <span>
                                            <Price
                                                currencyCode={
                                                    subtotal.currency
                                                }
                                                value={
                                                    aw_store_credit.store_credit_amount ||
                                                    0
                                                }
                                            />
                                        </span>
                                    </div>
                                )}
                            </React.Fragment >
                        );
                    })}
                </>
            ) : null}
            {
                !!loyalty_points?.loyalty_points_total?.value &&
                <div
                    className={classes.shipping}
                >
                    <p>Burn Points</p>
                    <p>
                        <Price
                            currencyCode={loyalty_points.loyalty_points_total.currency}
                            value={-loyalty_points.loyalty_points_total.value}
                        />
                    </p>
                </div>
            }
            <div className={classes.total}>
                <span>
                    <FormattedMessage
                        id="orderDetails.total"
                        defaultMessage="Total"
                    />
                </span>
                <span>
                    <Price
                        value={grand_total.value}
                        currencyCode={grand_total.currency}
                    />
                </span>
            </div>
        </div>
    );
};

export default OrderTotal;

OrderTotal.propTypes = {
    classes: shape({
        root: string,
        heading: string,
        subTotal: string,
        discount: string,
        productDiscount: string,
        tax: string,
        shipping: string,
        total: string
    }),
    data: shape({
        discounts: arrayOf(
            shape({
                amount: shape({
                    currency: string,
                    value: number
                })
            })
        ),
        grand_total: shape({
            currency: string,
            value: number
        }),
        subtotal: shape({
            currency: string,
            value: number
        }),
        total_tax: shape({
            currency: string,
            value: number
        }),
        total_tp_discount: shape({
            currency: string,
            value: number,
        }),
        total_shipping: shape({
            currency: string,
            value: number
        })
    })
};
