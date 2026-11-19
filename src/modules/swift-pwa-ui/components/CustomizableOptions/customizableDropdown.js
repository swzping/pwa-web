import React from 'react';
import { array, func, shape, string, object, bool } from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Price from '@magento/venia-ui/lib/components/Price';
import Select from 'react-select';
import defaultClasses from './customizableOptions.module.css';

const CustomizableDropdown = props => {
    const { options, handleChange, selectedValue, isRequired } = props;
    const classes = useStyle(defaultClasses, props.classes);

    return options.map((item, index) => {
        return item.__typename == 'CustomizableDropDownOption' ? (
            <div className={classes.root} key={index}>
                <div className={classes.titleWrapper}>
                    <span className={classes.title}>
                        {!!item.required && (
                            <span className={classes.required}>*</span>
                        )}{' '}
                        {item.title}{' '}
                        {!!item.required &&
                            !!isRequired &&
                            selectedValue == null && (
                                <span className={classes.requiredInfo}>
                                    <FormattedMessage
                                        id={'customizable.required'}
                                        defaultMessage={'is Required'}
                                    />
                                </span>
                            )}
                    </span>
                </div>
                <Select
                    cacheOptions
                    defaultOptions
                    isClearable
                    options={item.value}
                    value={selectedValue}
                    getOptionLabel={e => (
                        <span>
                            {e.title},{' '}
                            <Price currencyCode="IDR" value={e.price} />
                        </span>
                    )}
                    getOptionValue={e => e.uid}
                    styles={{
                        menu: provided => ({ ...provided, zIndex: 9999 })
                    }}
                    onChange={handleChange}
                />
            </div>
        ) : null;
    });
};

CustomizableDropdown.propTypes = {
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

export default CustomizableDropdown;
