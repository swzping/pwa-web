import React, { useState, useEffect } from 'react';
import { useWindowSize } from '@magento/peregrine';
import { FormattedMessage, useIntl } from 'react-intl';
import { ChevronDown, ChevronUp } from 'react-feather';
import Price from '@magento/venia-ui/lib/components/Price';
import { usePriceSummary } from '@magento/peregrine/lib/talons/CartPage/PriceSummary/usePriceSummary';
import Button from '@magento/venia-ui/lib/components/Button';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './priceSummary.module.css';
import DiscountSummary from '@magento/venia-ui/lib/components/CartPage/PriceSummary/discountSummary';
import GiftCardSummary from './giftCardSummary.ee';
import ShippingSummary from './shippingSummary';
import TaxSummary from '@magento/venia-ui/lib/components/CartPage/PriceSummary/taxSummary';
import ItemsReview from './ItemsReview';

/**
 * A child component of the CartPage component.
 * This component fetches and renders cart data, such as subtotal, discounts applied,
 * gift cards applied, tax, shipping, and cart total.
 *
 * @param {Object} props
 * @param {Object} props.classes CSS className overrides.
 * See [priceSummary.module.css]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/PriceSummary/priceSummary.module.css}
 * for a list of classes you can override.
 *
 * @returns {React.Element}
 *
 * @example <caption>Importing into your project</caption>
 * import PriceSummary from "@magento/venia-ui/lib/components/CartPage/PriceSummary";
 */
const PriceSummary = props => {
    const { isUpdating, buttonCheckout, loadingRefetchDataCart, setLoadingRefetchDataCart, totalItems, content, isMobile: isM, selectedPoints, onLoyaltyPointsLoaded } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const [detailSummary, setDetailSummary] = useState(false);
    const talonProps = usePriceSummary({ totalItems, loadingRefetchDataCart, setLoadingRefetchDataCart });

    // Callback to pass applied loyalty points to parent component
    useEffect(() => {
        const appliedPoints = talonProps?.flatData?.loyalty_points?.loyalty_points_total?.value;
        const grandTotal = talonProps?.flatData?.total?.value;
        if (onLoyaltyPointsLoaded) {
            onLoyaltyPointsLoaded({
                appliedPoints: appliedPoints || 0,
                grandTotal: grandTotal || 0
            });
        }
    }, [talonProps?.flatData?.loyalty_points, talonProps?.flatData?.total, onLoyaltyPointsLoaded]);

    const {
        handleProceedToCheckout,
        hasError,
        hasItems,
        isCheckout,
        isLoading,
        flatData,
        isHasProductOOS,
        isHasUnavailableSalableQty,
    } = talonProps;
    const { formatMessage } = useIntl();

    const windowSize = useWindowSize();
    const isMobile = isM || windowSize.innerWidth < 1024;

    const showSummaryButton = () => {
        setDetailSummary(!detailSummary);
    };

    if (hasError) {
        return (
            <div className={classes.root}>
                <span className={classes.errorText}>
                    <FormattedMessage
                        id={'priceSummary.errorText'}
                        defaultMessage={
                            'Something went wrong. Please refresh and try again.'
                        }
                    />
                </span>
            </div>
        );
    } else if (!hasItems) {
        return null;
    }

    const {
        subtotal,
        total,
        discounts,
        promotions,
        giftCards,
        taxes,
        shipping,
        rewardPoints,
        storeCredits,
        awRaf,
        loyalty_points
    } = flatData;



    const isPriceUpdating = isUpdating || isLoading;
    const priceClass = isPriceUpdating ? classes.priceUpdating : classes.price;
    const totalPriceClass = isPriceUpdating
        ? classes.priceUpdating
        : classes.totalPrice;

    const totalPriceLabel = isCheckout
        ? formatMessage({
            id: 'priceSummary.orderTotal',
            defaultMessage: 'Order Total'
        })
        : formatMessage({
            id: 'priceSummary.orderTotal',
            defaultMessage: 'Order Total'
        });

    const summaryTitle = isCheckout ? (
        <div className={classes.summaryTitle}>
            <p>
                <FormattedMessage
                    id={'checkoutPage.summary'}
                    defaultMessage={'Summary'}
                />
            </p>
            {props.showItems ? <ItemsReview /> : null}
        </div>
    ) : (
        <div className={classes.summaryTitle}>
            <p>
                <FormattedMessage
                    id={'checkoutPage.orderSummary'}
                    defaultMessage={'Order Summary'}
                />
            </p>
        </div>
    );

    const proceedToCheckoutButton = !isCheckout ? (
        <div className={classes.checkoutButton_container}>
            <Button
                disabled={isPriceUpdating || isHasProductOOS || isHasUnavailableSalableQty}
                loading={isPriceUpdating}
                priority={'high'}
                onClick={handleProceedToCheckout}
                className={classes.buttonCheckout}
            >
                checkout
            </Button>
        </div>
    ) : null;

    const rewardPointAmounts = rewardPoints.is_use_reward_points ? (
        <>
            <span className={classes.lineItemLabel}>
                <FormattedMessage
                    id={'priceSummary.rewardPoint'}
                    defaultMessage={'Reward Point'}
                />
            </span>
            <span className={priceClass}>
                <Price
                    value={rewardPoints.reward_points_amount}
                    currencyCode={subtotal.currency}
                />
            </span>
        </>
    ) : null;

    const storeCreditsAmounts = storeCredits.is_use_store_credit ? (
        <>
            <span className={classes.lineItemLabel}>
                <FormattedMessage
                    id={'priceSummary.storeCredit'}
                    defaultMessage={'Store Credit'}
                />
            </span>
            <span className={priceClass}>
                <Price
                    value={storeCredits.store_credit_amount}
                    currencyCode={subtotal.currency}
                />
            </span>
        </>
    ) : null;

    const awRafDiscount = awRaf?.status ? (
        <>
            <span className={classes.lineItemLabel}>
                <FormattedMessage
                    id={'priceSummary.awRaf'}
                    defaultMessage={awRaf.name}
                />
            </span>
            <span className={priceClass}>
                <Price
                    value={awRaf.value.discount_amount}
                    currencyCode={awRaf.value.currency}
                />
            </span>
        </>
    ) : null;

    let loyaltyPointsValue = null;
    let loyaltyPointsCurrency = null;
    if (selectedPoints) {
        loyaltyPointsValue = selectedPoints;
        loyaltyPointsCurrency = subtotal.currency;
    } else if (loyalty_points?.loyalty_points_total?.value) {
        loyaltyPointsValue = loyalty_points.loyalty_points_total.value;
        loyaltyPointsCurrency = loyalty_points.loyalty_points_total.currency;
    }

    const loyaltyPointsAmounts = loyaltyPointsValue ? (
        <>
            <span className={classes.lineItemLabel}>
                <FormattedMessage
                    id={'priceSummary.loyaltyPoints'}
                    defaultMessage={'Redeem Points'}
                />
            </span>
            <span className={priceClass}>
                <Price
                    value={-loyaltyPointsValue}
                    currencyCode={loyaltyPointsCurrency}
                />
            </span>
        </>
    ) : null;

    return (
        <>
            {!isMobile ? (
                <div className={`${classes.root}`}>
                    {summaryTitle}
                    <div className={classes.lineItems}>
                        <span className={classes.lineItemLabel}>
                            <FormattedMessage
                                id={'priceSummary.lineItemLabel'}
                                defaultMessage={'Subtotal'}
                            />
                        </span>
                        <span className={priceClass}>
                            <Price
                                value={subtotal.value}
                                currencyCode={subtotal.currency}
                            />
                        </span>
                    </div>
                    {
                        shipping.length > 0 && shipping[0].selected_shipping_method && (
                            <div className={classes.lineItems}>
                                <ShippingSummary
                                    classes={{
                                        lineItemLabel: classes.lineItemLabel,
                                        price: priceClass
                                    }}
                                    data={shipping}
                                    isCheckout={isCheckout}
                                />
                            </div>
                        )
                    }
                    <div className={classes.lineItems}>
                        <TaxSummary
                            classes={{
                                lineItemLabel: classes.lineItemLabel,
                                price: priceClass
                            }}
                            data={taxes}
                            isCheckout={isCheckout}
                        />
                        <GiftCardSummary
                            classes={{
                                lineItemLabel: classes.lineItemLabel,
                                price: priceClass
                            }}
                            data={giftCards}
                        />
                        {rewardPointAmounts}
                        {storeCreditsAmounts}
                        {awRafDiscount}
                        <DiscountSummary
                            classes={{
                                lineItemLabel: classes.lineItemLabel,
                                price: priceClass,
                                discountTag: classes.discountTag,
                                discountTagPrice: classes.discountTagPrice,
                                discountStudentPassTag: classes.discountStudentPassTag,
                                discountStudentPassTagPrice: classes.discountStudentPassTagPrice
                            }}
                            data={discounts}
                            promotions={promotions}
                        />
                    </div>
                    <div className={classes.lineItems}>{loyaltyPointsAmounts}</div>
                    <div className={classes.totalWrapper}>
                        <span className={classes.totalLabel}>
                            {totalPriceLabel}
                        </span>
                        <span className={totalPriceClass} id="totalPriceElement">
                            <Price
                                value={total.value}
                                currencyCode={total.currency}
                            />
                        </span>
                    </div>
                    {proceedToCheckoutButton}
                </div>
            ) : (
                <div className={`${classes.mobileRoot}`}>
                    <div className={`${classes.mobilePriceIcon}`}>
                        <label>
                            {
                                formatMessage({
                                    id: 'priceSummary.total',
                                    defaultMessage: 'Subtotal'
                                })
                            }
                        </label>
                        <Price
                            value={subtotal.value}
                            currencyCode={subtotal.currency}
                        />
                        <button
                            className={classes.hideButton}
                            onClick={showSummaryButton}
                        >
                            {detailSummary ? <ChevronDown /> : <ChevronUp />}
                        </button>
                    </div>
                    {detailSummary && (
                        <>
                            {props.showItems ? <div className={classes.wrapperMobile}>
                                <ItemsReview />
                            </div> : null}
                            <div className={classes.lineItems}>
                                <span className={classes.lineItemLabel}>
                                    <FormattedMessage
                                        id={'priceSummary.lineItemLabel'}
                                        defaultMessage={'Subtotal'}
                                    />
                                </span>
                                <span className={priceClass}>
                                    <Price
                                        value={subtotal.value}
                                        currencyCode={subtotal.currency}
                                    />
                                </span>
                            </div>
                            {
                                shipping.length > 0 && shipping[0].selected_shipping_method && (
                                    <div className={classes.lineItems}>
                                        <ShippingSummary
                                            classes={{
                                                lineItemLabel: classes.lineItemLabel,
                                                price: priceClass
                                            }}
                                            data={shipping}
                                            isCheckout={isCheckout}
                                        />
                                    </div>
                                )
                            }
                            <div className={classes.lineItems}>
                                <TaxSummary
                                    classes={{
                                        lineItemLabel: classes.lineItemLabel,
                                        price: priceClass
                                    }}
                                    data={taxes}
                                    isCheckout={isCheckout}
                                />

                                <GiftCardSummary
                                    classes={{
                                        lineItemLabel: classes.lineItemLabel,
                                        price: priceClass
                                    }}
                                    data={giftCards}
                                />
                                {rewardPointAmounts}
                                {storeCreditsAmounts}
                                {awRafDiscount}
                                <DiscountSummary
                                    classes={{
                                        lineItemLabel: classes.lineItemLabel,
                                        price: priceClass,
                                        discountTag: classes.discountTag,
                                        discountTagPrice: classes.discountTagPrice,
                                        discountStudentPassTag: classes.discountStudentPassTag,
                                        discountStudentPassTagPrice: classes.discountStudentPassTagPrice
                                    }}
                                    data={discounts}
                                    promotions={promotions}
                                />
                            </div>
                        </>
                    )}
                    <div className={classes.lineItems}>{loyaltyPointsAmounts}</div>
                    <div className={classes.mobilePriceSummary}>
                        <span>{totalPriceLabel} </span>
                        <span>
                            <Price
                                value={total.value}
                                currencyCode={total.currency}
                            />
                        </span>
                    </div>
                    {proceedToCheckoutButton}
                    {buttonCheckout}
                    {content}
                </div>
            )}
        </>
    );
};

export default PriceSummary;
