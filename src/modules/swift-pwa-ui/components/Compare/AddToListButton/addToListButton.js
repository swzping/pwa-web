import React, { useRef } from 'react';
import { Columns } from 'react-feather';
import { useButton } from 'react-aria';
import { element, func, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Icon from '@magento/venia-ui/lib/components/Icon';

import { useAddToListButton } from '../../../../peregrine/talons/Compare/AddToListButton/useAddToListButton';
import { useCommonToasts } from '../../../../peregrine/talons/Compare/AddToListButton/useCommonToasts';

import defaultClasses from './addToListButton.module.css';

const CompareIcon = <Icon size={20} src={Columns} />;

const AddToListButton = props => {
    const talonProps = useAddToListButton(props);
    const buttonRef = useRef();

    const {
        buttonProps,
        buttonText,
        errorToastProps,
        existToastProps,
        isSelected,
        successToastProps
    } = talonProps;

    useCommonToasts({ errorToastProps, existToastProps, successToastProps });
    const { buttonProps: ariaButtonProps } = useButton(buttonProps, buttonRef);

    const classes = useStyle(defaultClasses, props.classes);
    const buttonClass = isSelected ? classes.root_selected : classes.root;

    return (
        <button ref={buttonRef} className={buttonClass} {...ariaButtonProps}>
            {props.icon} {buttonText}
        </button>
    );
};

export default AddToListButton;

AddToListButton.defaultProps = {
    icon: CompareIcon
};

AddToListButton.propTypes = {
    afterAdd: func,
    beforeAdd: func,
    classes: shape({
        root: string,
        root_selected: string
    }),
    icon: element
};
