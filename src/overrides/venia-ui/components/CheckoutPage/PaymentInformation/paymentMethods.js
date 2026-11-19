import React, {useEffect} from 'react';
import { shape, string, bool, func } from 'prop-types';
import { useIntl } from 'react-intl';
import ReactDOM from 'react-dom';

import { usePaymentMethods } from '@magento/peregrine/lib/talons/CheckoutPage/PaymentInformation/usePaymentMethods';

import { useStyle } from '@magento/venia-ui/lib/classify';
import RadioGroup from '@magento/venia-ui/lib/components/RadioGroup';
import Radio from '@magento/venia-ui/lib/components/RadioGroup/radio';
import defaultClasses from '@magento/venia-ui/lib/components/CheckoutPage/PaymentInformation/paymentMethods.module.css';
import payments from '@magento/venia-ui/lib/components/CheckoutPage/PaymentInformation/paymentMethodCollection';
import { Accordion, Section } from '@magento/venia-ui/lib/components/Accordion';

const PaymentMethods = props => {
    const {
        classes: propClasses,
        onPaymentError,
        onPaymentSuccess,
        resetShouldSubmit,
        shouldSubmit,
        setIsUpdating,
        onChangePaymentHandler,
        setUpdatePaymentLoading
    } = props;

    const { formatMessage } = useIntl();

    const classes = useStyle(defaultClasses, propClasses);

    const talonProps = usePaymentMethods({});

    const {
        paymentConfig,
        availablePaymentMethods,
        currentSelectedPaymentMethod,
        initialSelectedMethod,
        isLoading
    } = talonProps;
    
    useEffect(() => {
        if (!isLoading && initialSelectedMethod) {
            onChangePaymentHandler(initialSelectedMethod);
        }
    }, [initialSelectedMethod, isLoading]);

    if (isLoading) {
        return null;
    }

    const generatePaymentGrouping = (paymentConfig) => {
        const parsedPaymentConfig = JSON.parse(paymentConfig);
        const paymentConfigKeys = paymentConfig ? Object.keys(parsedPaymentConfig) : [];
        // create grouping by config
        const paymentGrouping = paymentConfigKeys.map((key) => {
            const groupData = [];
            let config = parsedPaymentConfig[key];
            config = config.split(',');
            for (let idx = 0; idx < availablePaymentMethods.length; idx++) {
                const element = availablePaymentMethods[idx];
                for (let idc = 0; idc < config.length; idc++) {
                    if (config[idc] === element.code) {
                        groupData.push(element);
                    }
                }
            }
            return {
                group: key,
                data: groupData,
            };
        });

        
        return paymentGrouping;
    }

    const paymentGroupingLabelEnum = {
        'pg-banktransfer': formatMessage({
            id: 'checkoutPage.paymentGrouping.banktransfer',
            defaultMessage: 'Bank Transfer'
        }),
        'pg-installment': formatMessage({
            id: 'checkoutPage.paymentGrouping.installment',
            defaultMessage: 'Installment'
        }),
        'pg-creditcard': formatMessage({
            id: 'checkoutPage.paymentGrouping.creditcard',
            defaultMessage: 'Credit Card'
        }),
        'pg-internetpayment': formatMessage({
            id: 'checkoutPage.paymentGrouping.internetpayment',
            defaultMessage: 'Internet Payment'
        }),
        'pg-others': formatMessage({
            id: 'checkoutPage.paymentGrouping.others',
            defaultMessage: 'Others'
        }),
    };
    const paymentGrouping = generatePaymentGrouping(paymentConfig);

    const noPaymentMethodMessage = !paymentGrouping.length ? (
        <div className={classes.payment_errors}>
            <span>
                {formatMessage({
                    id: 'checkoutPage.paymentLoadingError',
                    defaultMessage: 'There was an error loading payments.'
                })}
            </span>
            <span>
                {formatMessage({
                    id: 'checkoutPage.refreshOrTryAgainLater',
                    defaultMessage: 'Please refresh or try again later.'
                })}
            </span>
        </div>
    ) : null;

    return (
        <div className={classes.root}>
            <RadioGroup
                classes={{ root: classes.radio_group }}
                field="selectedPaymentMethod"
                initialValue={initialSelectedMethod}
            >
                {paymentGrouping
                    .filter((paymentGroup) => paymentGroup.data.length > 0)
                    .map((paymentGroup) => (
                        <Accordion key={paymentGroup.group} canOpenMultiple={false} classes={{ root: classes.accordion }}>
                            {/* <Section
                                title={paymentGroupingLabelEnum[paymentGroup.group]}
                                classes={{ 
                                    root: classes.payment_group,
                                    title: classes.payment_group_title,
                                }}
                            > */}
                                <div>
                                    {paymentGroup.data.map((item, index) => {
                                        const id = `paymentMethod--${item.code}`;
                                        const isSelected = currentSelectedPaymentMethod === item.code;
                                        const PaymentMethodComponent = payments[item.code];
                                        const renderedComponent = isSelected ? ReactDOM.createPortal(
                                            <PaymentMethodComponent
                                                onPaymentSuccess={onPaymentSuccess}
                                                onPaymentError={onPaymentError}
                                                resetShouldSubmit={resetShouldSubmit}
                                                shouldSubmit={shouldSubmit}
                                            />, document.getElementById('PaymentMethodComponentTarget')
                                        ) : null;

                                        return (
                                            <div key={`${paymentGroup.group}-${item.code}-${index}`} className={classes.payment_method}>
                                                <Radio
                                                    id={id}
                                                    label={item.title}
                                                    value={item.code}
                                                    classes={{
                                                        label: classes.radio_label
                                                    }}
                                                    checked={isSelected}
                                                    disabled={setUpdatePaymentLoading}
                                                    onClick={() => onChangePaymentHandler(item.code)}
                                                />
                                                {renderedComponent}
                                            </div>
                                        );
                                    })}
                                </div>
                            {/* </Section> */}
                        </Accordion>
                    ))}
            </RadioGroup>
            {noPaymentMethodMessage}
        </div>
    );
};

export default PaymentMethods;

PaymentMethods.propTypes = {
    classes: shape({
        root: string,
        payment_method: string,
        radio_label: string
    }),
    onPaymentSuccess: func,
    onPaymentError: func,
    resetShouldSubmit: func,
    selectedPaymentMethod: string,
    shouldSubmit: bool
};
