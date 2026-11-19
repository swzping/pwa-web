import React, { Fragment, useEffect, useState, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { useToasts } from '@magento/peregrine';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import { useCouponCode } from '@magento/peregrine/lib/talons/CartPage/PriceAdjustments/CouponCode/useCouponCode';

import { useStyle } from '@magento/venia-ui/lib/classify';

import Button from '@magento/venia-ui/lib/components/Button';
import { Form } from 'informed';
import Field from '@magento/venia-ui/lib/components/Field';
import Icon from '@magento/venia-ui/lib/components/Icon';
import LinkButton from '@magento/venia-ui/lib/components/LinkButton';
import TextInput from '@magento/venia-ui/lib/components/TextInput';

import Shimmer from '@magento/venia-ui/lib/components/Shimmer';

import defaultClasses from './couponCode.module.css';
import PopUpWindow from '../../../../../venia-ui/components/PopUpWindow/popUpWindow'
import CouponSelector from '../CouponSelector/couponSelector';
import { useQuery } from '@apollo/client';
import DEFAULT_OPERATIONS from '../../../../../../modules/swift-pwa-ui/components/MyCoupon/myCoupon.gql.js'
import MyVoucherPopup from "../../MyVoucher/MyVoucherPopup"
import { useWindowSize } from '@magento/peregrine';
import { refreshCheckoutCouponData } from './couponRefresh';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

/**
 * A child component of the PriceAdjustments component.
 * This component renders a form for addingg a coupon code to the cart.
 *
 * @param {Object} props
 * @param {Function} props.setIsCartUpdating Function for setting the updating state for the cart.
 * @param {Object} props.classes CSS className overrides.
 * See [couponCode.module.css]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/PriceAdjustments/CouponCode/couponCode.module.css}
 * for a list of classes you can override.
 *
 * @returns {React.Element}
 *
 * @example <caption>Importing into your project</caption>
 * import CouponCode from "@magento/venia-ui/lib/components/CartPage/PriceAdjustments/CouponCode";
 */
const CouponCode = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { isCheckout = false } = props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dataAppliedCoupon, setDataAppliedCoupon] = useState(null);
    const couponFormApi = useRef(null);
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const [isShowError, setIsShowError] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false); // 标记是否正在提交
    const { data: couponsData } = useQuery(DEFAULT_OPERATIONS.getCouponWallet, {
        fetchPolicy: 'no-cache',
        variables: {
            currentPage: 1,
            pageSize: 1,
            status: 'valid',
        }
    });
    const talonProps = useCouponCode({
        setIsCartUpdating: props.setIsCartUpdating,
        dataAppliedCoupon,
        setLoadingRefetchDataCart: props.setLoadingRefetchDataCart
    });

    const [, { addToast }] = useToasts();
    const {
        applyingCoupon,
        data,
        errors,
        handleApplyCoupon,
        handleRemoveCoupon,
        removingCoupon,
        applyingMultipleCoupon,
        handleApplyMultipleCoupon,
        handleRemoveMultipleCoupon,
        removingMultipleCoupon,
        applyErrorToast
    } = talonProps;
    const { formatMessage } = useIntl();
    // default magento
    // const removeCouponError = deriveErrorMessage([
    //     errors.get('removeCouponMutation')
    // ]);

    // default magento
    // useEffect(() => {
    //     if (removeCouponError) {
    //         addToast({
    //             type: 'error',
    //             icon: errorIcon,
    //             message: removeCouponError,
    //             dismissable: true,
    //             timeout: 10000
    //         });
    //     }
    // }, [addToast, removeCouponError]);

    const removeMultipleCouponError = deriveErrorMessage([
        errors.get('removeMultipleCouponMutation')
    ]);

    useEffect(() => {
        if (removeMultipleCouponError) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: removeMultipleCouponError,
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, removeMultipleCouponError]);

    useEffect(() => {
        if (data) {
            const dataCouponMagento = data && data.cart && data.cart.applied_coupons;
            setDataAppliedCoupon(dataCouponMagento);
        }
    }, [data]);

    useEffect(() => {
        if (applyErrorToast && !isSubmitting) {
            setIsShowError(true);
        }
    }, [applyErrorToast, isSubmitting]);
    if (!data) {
        return null;
    }

    if (errors.get('getAppliedCouponsQuery')) {
        return (
            <div className={classes.errorContainer}>
                <FormattedMessage
                    id={'couponCode.errorContainer'}
                    defaultMessage={
                        'Something went wrong. Please refresh and try again.'
                    }
                />
            </div>
        );
    }

    // default magento
    // const errorMessage = deriveErrorMessage([
    //     errors.get('applyCouponMutation')
    // ]);

    const errorMultipleCouponMessage = deriveErrorMessage([
        errors.get('applyMultipleCouponMutation')
    ]);

    const formClass = errorMultipleCouponMessage
        ? classes.entryFormError
        : classes.entryForm;

    const dataAppliedCouponManual = data && data.cart && data.cart.applied_manual_coupon;
    const appliedCouponsWithDiscount = data?.cart?.applied_coupons || [];
    const voucherDiscountLabels = appliedCouponsWithDiscount
        .map(({ is_cashback_coupon, rule_name, discount_amount, is_free_gift_coupon, cashback_amount }) => {
            if (is_cashback_coupon) {
                const ruleLabel =
                    (typeof rule_name === 'string' && rule_name.trim()) || 'Cashback';
                const numericCashback = Number(cashback_amount);
                const cashbackLabel =
                    Number.isFinite(numericCashback) && numericCashback > 0
                        ? `Rp ${numericCashback.toLocaleString('en-US')}`
                        : '';
                return {
                    label: cashbackLabel ? `${ruleLabel} ${cashbackLabel}` : ruleLabel,
                    isCashback: true
                };
            }
            if (is_free_gift_coupon) return { label: 'Free item', isCashback: false };

            const numericAmount = Number(discount_amount);
            return Number.isFinite(numericAmount) && numericAmount > 0
                ? {
                    label: `-Rp ${Math.abs(numericAmount).toLocaleString('en-US')}`,
                    isCashback: false
                }
                : null;
        })
        .filter(Boolean);
    const appliedCouponCodes = appliedCouponsWithDiscount
        .flatMap(({ code, coupon_code }) => String(code || coupon_code || '').split(/[,\s]+/))
        .filter(Boolean);

    const handleApplyCheckoutCoupon = async couponCode => {
        if (couponCode == null) return;
        setIsShowError(false);
        setIsSubmitting(true);
        try {
            await handleApplyMultipleCoupon({
                couponCode,
                preserveExistingCoupons: false
            });
            await refreshCheckoutCouponData({
                refreshPriceSummary: props.onCouponApplied,
                refreshPaymentInformation: props.onCouponAppliedRefreshPayment
            });
            setIsModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckout) {
        return (
            <div className={classes.checkoutVoucherWrapper}>
                <button
                    className={classes.checkoutVoucherRow}
                    onClick={() => setIsModalOpen(true)}
                    type="button"
                >
                    <span className={classes.checkoutVoucherTitle}>Vouchers</span>
                    <span className={classes.checkoutVoucherSummary}>
                        {voucherDiscountLabels.slice(0, 2).map(({ label, isCashback }, index) => (
                            <span
                                className={`${classes.checkoutVoucherPill} ${isCashback ? classes.cashbackVoucherPill : ''}`}
                                key={`${label}-${index}`}
                            >
                                {label}
                            </span>
                        ))}
                        {voucherDiscountLabels.length > 2 && (
                            <span className={`${classes.checkoutVoucherPill} ${classes.cashbackVoucherPill} ${classes.checkoutVoucherMore}`}>
                                ...
                            </span>
                        )}
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9.7775 6.4675L5.7775 2.4675C5.4875 2.1775 5.0075 2.1775 4.7175 2.4675C4.4275 2.7575 4.4275 3.2375 4.7175 3.5275L8.1875 6.9975L4.7175 10.4675C4.4275 10.7575 4.4275 11.2375 4.7175 11.5275C4.8675 11.6775 5.0575 11.7475 5.2475 11.7475C5.4375 11.7475 5.6275 11.6775 5.7775 11.5275L9.7775 7.5275C10.0675 7.2375 10.0675 6.7575 9.7775 6.4675Z" fill="#FF8200"></path>
                            </svg>
                        </span>
                    </span>
                </button>
                {(!!applyErrorToast && isShowError) && (
                    <div className={defaultClasses.errorInfo}>
                        <div style={{ marginLeft: "10px" }}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
                            <path d="M9 18.5C13.9706 18.5 18 14.4706 18 9.5C18 4.52944 13.9706 0.5 9 0.5C4.02944 0.5 0 4.52944 0 9.5C0 14.4706 4.02944 18.5 9 18.5Z" fill="#E41305" />
                            <path d="M12.8122 5.68775C12.3575 5.23299 11.6203 5.23313 11.1655 5.68775L8.9999 7.85339L6.83426 5.68775C6.37965 5.23299 5.6424 5.23299 5.18764 5.68775C4.73303 6.14237 4.73303 6.87961 5.18764 7.33437L7.35328 9.50016L5.18764 11.6659C4.73303 12.1206 4.73303 12.8578 5.18764 13.3126C5.64226 13.7673 6.3795 13.7672 6.83426 13.3126L8.9999 11.1469L11.1655 13.3126C11.6202 13.7673 12.3574 13.7673 12.8122 13.3126C13.2668 12.8579 13.2668 12.1207 12.8122 11.6659L10.6465 9.50016L12.8122 7.33437C13.2668 6.87975 13.2668 6.14251 12.8122 5.68775Z" fill="white" />
                        </svg>
                        </div>
                        <p>{applyErrorToast}</p>
                    </div>
                )}
                <PopUpWindow
                    contentClassName="checkout-voucher-modal"
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                >
                    <CouponSelector
                        isCheckout={true}
                        isApplying={isSubmitting || applyingMultipleCoupon}
                        appliedCouponCodes={appliedCouponCodes}
                        onApply={handleApplyCheckoutCoupon}
                        onClose={() => setIsModalOpen(false)}
                    />
                </PopUpWindow>
            </div>
        );
    }

    return (
        <div className={classes.appliedCouponWrapper}>

            <Form
                getApi={api => (couponFormApi.current = api)}
                className={formClass}
                onSubmit={async (values) => {
                    setIsShowError(false);
                    setIsSubmitting(true);
                    try {
                        await handleApplyMultipleCoupon(values);
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >

                <div style={{ display: 'flex', gap: "10px", alignItems: "flex-end", justifyContent: "center" }}><Field
                    id="couponCode"
                    label={formatMessage({
                        id: 'cartPage.couponCode',
                        defaultMessage: 'Coupon Code'
                    })}
                >
                    <TextInput
                        field="couponCode"
                        id={'couponCode'}
                        placeholder={formatMessage({
                            id: 'couponCode.enterCode',
                            defaultMessage: 'Enter code'
                        })}
                        mask={value => value && value.trim()}
                        maskOnBlur={true}
                        message={errorMultipleCouponMessage}
                        disabled={dataAppliedCouponManual?.length > 0}
                    />
                </Field>

                    <Field>
                        <Button
                            disabled={dataAppliedCouponManual?.length > 0}
                            priority={'normal'}
                            type={'submit'}
                        >
                            <FormattedMessage
                                id={'couponCode.apply'}
                                defaultMessage={'Apply'}
                            />
                        </Button>
                    </Field>

                    {!isMobile && (<Field className={defaultClasses.voucherListOut}>
                        <Button
                            className={defaultClasses.voucherList}
                            priority={'normal'}
                            onClick={() => setIsModalOpen(true)}
                        >
                            <FormattedMessage
                                id={'Check My eVoucher'}
                                defaultMessage={`Check My eVoucher(${couponsData?.customerCoupons?.totalCount || '0'})`}
                            />
                        </Button>
                    </Field>)}
                </div>
                {(!!applyErrorToast && isShowError) && (<div className={defaultClasses.errorInfo}>
                    <div style={{ marginLeft: "10px" }}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
                        <path d="M9 18.5C13.9706 18.5 18 14.4706 18 9.5C18 4.52944 13.9706 0.5 9 0.5C4.02944 0.5 0 4.52944 0 9.5C0 14.4706 4.02944 18.5 9 18.5Z" fill="#E41305" />
                        <path d="M12.8122 5.68775C12.3575 5.23299 11.6203 5.23313 11.1655 5.68775L8.9999 7.85339L6.83426 5.68775C6.37965 5.23299 5.6424 5.23299 5.18764 5.68775C4.73303 6.14237 4.73303 6.87961 5.18764 7.33437L7.35328 9.50016L5.18764 11.6659C4.73303 12.1206 4.73303 12.8578 5.18764 13.3126C5.64226 13.7673 6.3795 13.7672 6.83426 13.3126L8.9999 11.1469L11.1655 13.3126C11.6202 13.7673 12.3574 13.7673 12.8122 13.3126C13.2668 12.8579 13.2668 12.1207 12.8122 11.6659L10.6465 9.50016L12.8122 7.33437C13.2668 6.87975 13.2668 6.14251 12.8122 5.68775Z" fill="white" />
                    </svg>
                    </div>
                    <p>{applyErrorToast}</p>
                </div>)}
                {isMobile && (<Field className={defaultClasses.voucherListOut}>
                    <Button
                        className={defaultClasses.voucherList}
                        priority={'normal'}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <FormattedMessage
                            id={'Check My eVoucher'}
                            defaultMessage={`Check My eVoucher(${couponsData?.customerCoupons?.totalCount || '0'})`}
                        />
                    </Button>
                </Field>)}

            </Form>

            <div>
                {dataAppliedCouponManual && !applyingMultipleCoupon && !removingMultipleCoupon
                    ? (
                        <>
                            {
                                dataAppliedCouponManual.map(({ coupon_code }) => {
                                    return (
                                        <Fragment key={coupon_code}>
                                            <div className={classes.itemCouponWrapper}>
                                                <p className={classes.itemCoupon}>{coupon_code}</p>
                                                <LinkButton
                                                    className={classes.removeButton}
                                                    disabled={removingMultipleCoupon}
                                                    onClick={() => handleRemoveMultipleCoupon(coupon_code)}
                                                >
                                                    <FormattedMessage
                                                        id={'couponCode.removeButton'}
                                                        defaultMessage={'Remove'}
                                                    />
                                                </LinkButton>
                                            </div>
                                        </Fragment>
                                    )
                                })
                            }
                        </>
                    )
                    : !dataAppliedCouponManual && !applyingMultipleCoupon && !removingMultipleCoupon ? null : (
                        <div>
                            <Shimmer width={20} key="coupon" />
                            <Shimmer width={20} key="coupon" />
                        </div>
                    )
                }
            </div>
            <div>
                {!isMobile && (<PopUpWindow isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <CouponSelector
                        onApply={(applyData) => {
                            if (couponFormApi.current) {
                                couponFormApi.current.setValue('couponCode', applyData);
                                setIsModalOpen(false);
                            }
                        }}
                        onClose={() => setIsModalOpen(false)}
                    />
                </PopUpWindow>)}
                {isMobile && (<MyVoucherPopup
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onApply={(applyData) => {
                        if (couponFormApi.current) {
                            couponFormApi.current.setValue('couponCode', applyData);
                            setIsModalOpen(false);
                        }
                    }} />)}
            </div>
        </div>
    );
};

export default CouponCode;
