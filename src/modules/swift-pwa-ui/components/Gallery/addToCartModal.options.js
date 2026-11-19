export const getModalOptionState = ({ classes, isDisabled, isSelected, isUnavailable, swatchContent }) => ({
    className: `${classes.optionItem} ${isSelected ? classes.optionItemSelected : ''} ${
        isUnavailable ? classes.optionItemUnavailable : ''
    } ${isDisabled ? classes.optionItemDisabled : ''} ${!swatchContent ? classes.optionItemLabelOnly : ''}`,
    disabled: isDisabled,
});
