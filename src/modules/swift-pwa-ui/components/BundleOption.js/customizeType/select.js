import React from 'react';
import Select from 'react-select';
import Price from '@magento/venia-ui/lib/components/Price';

const SelectItem = ({ data,  options = [], selectOptions }) => {
    let defaultValue = 0;
    for (let index = 0; index < options.length; index++) {
        const element = options[index];
        if (element.is_default) {
            defaultValue = element.id;
        }
    };

    const handleChangeTest = (e) => {
        selectOptions(data, parseInt(e.id));
    };
    return (
        <div>
            <Select
                cacheOptions
                defaultOptions
                // isClearable
                options={options}
                value={
                    options.filter(ops => ops.id === defaultValue)
                }
                getOptionLabel={e => (
                    <span>
                        {e.label},{' '}
                        <Price 
                            currencyCode={e.product.price_range.minimum_price.final_price.currency} 
                            value={e.product.price_range.minimum_price.final_price.value}                                
                        />
                    </span>
                )}
                getOptionValue={e => e.id}
                onChange={handleChangeTest}
            />
        </div>
    );
};

export default SelectItem;
