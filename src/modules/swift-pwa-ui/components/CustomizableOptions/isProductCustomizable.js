export const isCustomizableDropdown = product =>
    product.options &&
    product.options.filter(
        item => item.__typename == 'CustomizableDropDownOption'
    ).length > 0;

export const isCustomizableRadio = product =>
    product.options &&
    product.options.filter(item => item.__typename == 'CustomizableRadioOption')
        .length > 0;

export const isCustomizableCheckbox = product =>
    product.options &&
    product.options.filter(
        item => item.__typename == 'CustomizableCheckboxOption'
    ).length > 0;

export const isCustomizableMultiple = product =>
    product.options &&
    product.options.filter(
        item => item.__typename == 'CustomizableMultipleOption'
    ).length > 0;
