import React from 'react';
import { array, bool, func, object, shape, string } from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Price from '@magento/venia-ui/lib/components/Price';
import defaultClasses from './customizableOptions.module.css';

const CustomizableCheckbox = props => {
    const { options, handleChange, isRequired, selectedValue } = props;
    const classes = useStyle(defaultClasses, props.classes);

    return options.map((item, index) => {
        return item.__typename == 'CustomizableCheckboxOption' ? (
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
                {item.value.map((method, index) => (
                    <div key={index} className={classes.checkbox}>
                        <input
                            type="checkbox"
                            value={method.uid}
                            checked={method.uid == selectedValue}
                            onChange={handleChange}
                        />
                        <div className={classes.titleCheckbox}>
                            <span>
                                {method.title},{' '}
                                <Price
                                    currencyCode="IDR"
                                    value={method.price}
                                />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        ) : null;
    });
};

CustomizableCheckbox.propTypes = {
    classes: shape({
        root: string,
        titleWrapper: string,
        title: string,
        required: string,
        requiredInfo: string,
        checkbox: string,
        titleCheckbox: string
    }),
    handleChange: func,
    options: array.isRequired,
    selectedValue: object,
    isRequired: bool
};

export default CustomizableCheckbox;
