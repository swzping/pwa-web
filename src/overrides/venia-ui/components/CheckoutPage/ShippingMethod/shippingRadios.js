import React from 'react';
import { useIntl } from 'react-intl';
import { arrayOf, bool, number, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import RadioGroup from '@magento/venia-ui/lib/components/RadioGroup';
import ShippingRadio from './shippingRadio';
import defaultClasses from '@magento/venia-ui/lib/components/CheckoutPage/ShippingMethod//shippingRadios.module.css';

const ShippingRadios = props => {
    const { disabled, shippingMethods } = props;
    const { formatMessage } = useIntl();

    const classes = useStyle(defaultClasses, props.classes);

    const ERROR_MESSAGE = formatMessage({
        id: 'shippingRadios.errorLoading',
        defaultMessage:
            'Error loading shipping methods. Please ensure a shipping address is set and try again.'
    });

    const empty_error= "Error: the selected shipping method is not available for the chosen pharmacy. Please select another pharmacy. Or select Pickup at our store";

    if (!shippingMethods.length) {
        return <span className={classes.error}>{ERROR_MESSAGE}</span>;
    }

    const radioGroupClasses = {
        message: classes.radioMessage,
        radioLabel: classes.radioLabel,
        root: classes.radioRoot
    };

    const shippingRadios = shippingMethods.map(method => {
        const label = (
            <ShippingRadio
                currency={method.amount.currency}
                name={`${method.method_title} - ${method.carrier_title}`}
                price={method.amount.value}
                originalPrice={method.amount_before_discount?.value}
            />
        );
        const value = method.serializedValue;

        return { label, value };
    });

    return (
        <RadioGroup
            classes={radioGroupClasses}
            disabled={disabled}
            field="shipping_method"
            id={'shippingMethod'}
            items={shippingRadios}
        />
    );
};

export default ShippingRadios;

ShippingRadios.propTypes = {
    classes: shape({
        error: string,
        radioMessage: string,
        radioLabel: string,
        radioRoot: string
    }),
    disabled: bool,
    shippingMethods: arrayOf(
        shape({
            amount: shape({
                currency: string,
                value: number
            }),
            amount_before_discount: shape({
                currency: string,
                value: number
            }),
            available: bool,
            carrier_code: string,
            carrier_title: string,
            method_code: string,
            method_title: string,
            serializedValue: string.isRequired
        })
    ).isRequired
};
