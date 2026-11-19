import React from 'react';
import { func } from 'prop-types';
import { Search as SearchIcon, X as ClearIcon } from 'react-feather';
import { useSearchField } from '@magento/peregrine/lib/talons/SearchBar';

import Icon from '@magento/venia-ui/lib/components/Icon';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Trigger from '@magento/venia-ui/lib/components/Trigger';
import { usePlaceholder } from '../../../peregrine/talons/SearchBar/usePlaceholder';
import { CloseCircleFilled } from '../../../../assets/icons'
import defaultClasses from './searchField.module.css';

const clearIcon = <CloseCircleFilled style={{fontSize: '20px', color: 'rgba(0, 0, 0, 0.4)'}}/>;
const searchIcon = <Icon src={SearchIcon} size={24} />;

const SearchField = props => {
    const { isSearchOpen, onChange, onFocus } = props;
    const { inputRef, resetForm, value } = useSearchField({ isSearchOpen });
    const { placeholderData, placeholderLoading } = usePlaceholder();

    const resetButton = value ? (
        <Trigger action={resetForm}>{clearIcon}</Trigger>
    ) : null;

    if (placeholderLoading) {
        return null;
    }

    return (
        <TextInput
            classes={defaultClasses}
            after={resetButton}
            before={searchIcon}
            field="search_query"
            onFocus={onFocus}
            onValueChange={onChange}
            forwardedRef={inputRef}
            placeholder={placeholderData}
        />
    );
};

export default SearchField;

SearchField.propTypes = {
    onChange: func,
    onFocus: func
};
