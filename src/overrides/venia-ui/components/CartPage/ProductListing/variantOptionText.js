const getVariantOptionText = configurableOptions =>
    (configurableOptions || [])
        .map(option => option.value_label)
        .filter(Boolean)
        .join(', ');

export { getVariantOptionText };
