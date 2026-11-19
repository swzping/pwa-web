import React from 'react';
import Price from '@magento/venia-ui/lib/components/Price';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './customize.module.css';

const CheckboxItem = ({ val, selectOptions, data }) => {
    const classes = useStyle(defaultClasses);
    return (
        <div className="d-flex align-items-center mb-1">
            <input
                type="checkbox"
                onClick={() => selectOptions(data, val.id)}
                id={val.id}
                name={val.id}
                value={val.id}
                defaultChecked={val.is_default}
                className={`${classes.checkedInput} form-check-input`}
            />
            <label
                className={classes.labelOption}
                htmlFor={val.id}
            >
                {val.label}
                {' + '}
                <strong>
                    <Price 
                        currencyCode={val.product.price_range.minimum_price.final_price.currency} 
                        value={val.product.price_range.minimum_price.final_price.value}                                
                    />
                </strong>
            </label>
        </div>
    )
}

export default CheckboxItem
