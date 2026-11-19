import React from 'react';
import { bool, func, string } from 'prop-types';
import { Search as SearchIcon, X as ClearIcon } from 'react-feather';

import Icon from '@magento/venia-ui/lib/components/Icon';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Trigger from '@magento/venia-ui/lib/components/Trigger';

import { useSearchField } from '../../../peregrine/talons/AutoComplete/useSearchField';

const clearIcon = <Icon src={ClearIcon} size={24} />;
const searchIcon = <Icon src={SearchIcon} size={24} />;

const SearchField = props => {
    const { 
        fieldInput,
        fieldInputConstraints,
        isSearchOpen, 
        onChange, 
        onFocus,
        ...inputProps
    } = props;
    const {
        inputRef, 
        resetField, 
        value 
    } = useSearchField({
        fieldInput,
        fieldInputConstraints,
        isSearchOpen
    });

    const resetButton = value ? (
        <Trigger action={resetField}>{clearIcon}</Trigger>
    ) : null;

    return (
        <TextInput
            autoComplete="new-password"
            after={resetButton}
            before={searchIcon}
            field={fieldInput}
            onFocus={onFocus}
            onValueChange={onChange}
            forwardedRef={inputRef}
            {...inputProps}
        />
    );
};

export default SearchField;

SearchField.propTypes = {
    fieldInput: string,
    isSearchOpen: bool,
    onChange: func,
    onFocus: func
};
