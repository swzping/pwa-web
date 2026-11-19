import React from 'react';
import Select from 'react-select';
import Price from '@magento/venia-ui/lib/components/Price';

const MultipleItem = ({ data, options = [], selectOptions }) => {
    const defaultValue = [];
    for (let index = 0; index < options.length; index++) {
        const element = options[index];
        if (element.is_default) {
            defaultValue.push(element.id);
        }
    }

    const handleChangeTest = (e) => {
        const dataId = e.length > 0 ? e.map(x => x.id) : [];
        dataId.forEach(element => {
            selectOptions(data, element);
        });
    };
    return (
        <div>
            <Select
                cacheOptions
                defaultOptions
                isClearable
                isMulti
                options={options}
                value={options.filter((ops, idx) => ops.id === defaultValue[idx])}
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
    )
}

export default MultipleItem
