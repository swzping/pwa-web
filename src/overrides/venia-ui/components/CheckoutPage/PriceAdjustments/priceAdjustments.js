import React from 'react';
import { useIntl } from 'react-intl';
import { func } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { Accordion, Section } from '@magento/venia-ui/lib/components/Accordion';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import CouponCode from '@magento/venia-ui/lib/components/CartPage/PriceAdjustments/CouponCode';
import GiftCardSection from '@magento/venia-ui/lib/components/CartPage/PriceAdjustments/giftCardSection';
// import GiftOptions from '@magento/venia-ui/lib/components/CartPage/PriceAdjustments/GiftOptions';

import defaultClasses from './priceAdjustments.module.css';
import RewardPoint from '../../../../../modules/swift-pwa-ui/components/RewardPoint';
import StoreCredit from '../../../../../modules/swift-pwa-ui/components/StoreCredit';

/**
 * PriceAdjustments component for the Checkout page.

 * @param {Function} props.setPageIsUpdating callback that sets checkout page updating state
 */
const PriceAdjustments = props => {
    const classes = useStyle(defaultClasses, props.classes);

    const {
        setPageIsUpdating,
        loadingRefetchDataCart = false,
        setLoadingRefetchDataCart = () => {},
        onCouponApplied,
        onCouponAppliedRefreshPayment
    } = props;
    const { formatMessage } = useIntl();

    const [{ isSignedIn }] = useUserContext();

    return (
        <div className={classes.root}>
            {/* <Accordion canOpenMultiple={true}> */}
                {/* <Section
                    id={'coupon_code'}
                    title={formatMessage({
                        id: 'checkoutPage.couponCode',
                        defaultMessage: 'Enter Coupon Code'
                    })}
                > */}
                <div className={classes.couponWrapper}>
                    <CouponCode
                        isCheckout={true}
                        setIsCartUpdating={setPageIsUpdating}
                        setLoadingRefetchDataCart={setLoadingRefetchDataCart}
                        loadingRefetchDataCart={loadingRefetchDataCart}
                        onCouponApplied={onCouponApplied}
                        onCouponAppliedRefreshPayment={onCouponAppliedRefreshPayment}
                    />
                </div>
                {/* </Section> */}
                {/* <GiftCardSection setIsCartUpdating={setPageIsUpdating} /> */}
                {/* <Section
                    id={'gift_options'}
                    title={formatMessage({
                        id: 'checkoutPage.giftOptions',
                        defaultMessage: 'See Gift Options'
                    })}
                >
                    <GiftOptions />
                </Section> */}
                { 0 ? (
                    // <Section
                    //     id={'points'}
                    //     title={formatMessage({
                    //         id: 'points.spend',
                    //         defaultMessage: 'Spend Your Points'
                    //     })}
                    // >
                    <div class={classes.priceWrapper}>
                        <div className={classes.rewardpointTitle}>
                            {formatMessage({
                                id: 'points.spend',
                                defaultMessage: 'Spend Your Points'
                            })}
                        </div>
                        <div className={classes.rewardpoint}>
                            <RewardPoint
                                setIsCartUpdating={setPageIsUpdating}
                            />
                        </div>
                        <div className={classes.storecredit}>
                            <StoreCredit
                                setIsCartUpdating={setPageIsUpdating}
                            />
                        </div>
                    </div>
                    // </Section>
                ) : null}
            {/* </Accordion> */}
        </div>
    );
};

export default PriceAdjustments;

PriceAdjustments.propTypes = {
    setPageIsUpdating: func
};
