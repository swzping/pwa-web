import React from 'react';
import { array, func, shape, string, object, bool } from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Radio from '@magento/venia-ui/lib/components/RadioGroup';
import Price from '@magento/venia-ui/lib/components/Price';
import defaultClasses from './customizableOptions.module.css';

const CustomizableRadio = props => {
    const { options, handleChange, isRequired, selectedValue } = props;
    const classes = useStyle(defaultClasses, props.classes);

    return options.map((item, index) => {
        return item.__typename == 'CustomizableRadioOption' ? (
            <div className={classes.root} key={index}>
                <div className={classes.titleWrapper}>
                    <span className={classes.title}>
                        {!!item.required && (
                            <span className={classes.required}>*</span>
                        )}{' '}
                        {item.title}{' '}
                        {!!item.required &&
                            !!isRequired &&
                            selectedValue == '' && (
                                <span className={classes.requiredInfo}>
                                    <FormattedMessage
                                        id={'customizable.required'}
                                        defaultMessage={'is Required'}
                                    />
                                </span>
                            )}
                    </span>
                </div>
                <Radio
                    field="radio_options"
                    id="radio"
                    items={item.value.map(method => {
                        const labelComponent = (
                            <span>
                                {method.title},{' '}
                                <Price
                                    currencyCode="IDR"
                                    value={method.price}
                                />
                            </span>
                        );

                        return {
                            label: labelComponent,
                            value: method.uid
                        };
                    })}
                    onChange={handleChange}
                />
            </div>
        ) : null;
    });
};

CustomizableRadio.propTypes = {
    classes: shape({
        root: string,
        titleWrapper: string,
        title: string,
        required: string,
        requiredInfo: string
    }),
    handleChange: func,
    options: array.isRequired,
    selectedValue: object,
    isRequired: bool
};

export default CustomizableRadio;
