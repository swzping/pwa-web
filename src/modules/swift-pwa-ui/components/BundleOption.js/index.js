import React, { useState } from 'react';
import Select from 'react-select';
import Price from '@magento/venia-ui/lib/components/Price';
import SelectItem from './customizeType/select';
import RadioItem from './customizeType/radio';
import CheckboxItem from './customizeType/checkbox';
import MultipleItem from './customizeType/multiple';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './bundleOption.module.css';

const GenerateOptionsSelect = (props) => {
    const { data, options = [], selectOptions } = props;
    if (data.type === 'select') {
        return <SelectItem {...props} />;
    } if (data.type === 'multi') {
        return <MultipleItem {...props} />
    }
    return options.map((val, idx) => {
        if (data.type === 'radio') {
            return <RadioItem val={val} key={idx} data={data} selectOptions={selectOptions} />
        } if (data.type === 'checkbox') {
            return <CheckboxItem val={val} key={idx} data={data} selectOptions={selectOptions} />
        }

        return null;
    });
};

const BundleOption = (props) => {
    const {
        items,
        selectOptions,
    } = props;

    const classes = useStyle(defaultClasses);

    return (
        <div className={classes.root}>
            {
                items.length > 0 ? (
                    <>
                        {
                            items.map((val, idx) => (
                                <div key={idx}>
                                    <p className={classes.optionTitle}>
                                        {val.title}
                                        {' '}
                                        {val.required && <span className={classes.requiredTitle}>*</span>}
                                    </p>
                                    <GenerateOptionsSelect
                                        data={val}
                                        options={val.options}
                                        selectOptions={selectOptions}
                                    />
                                </div>
                            ))
                        }
                    </>
                ) : null
            }
        </div>
    )
}

export default BundleOption;
