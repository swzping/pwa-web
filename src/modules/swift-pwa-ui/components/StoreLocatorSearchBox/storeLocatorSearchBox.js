import React from 'react';
import { bool, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';

import { useAutoComplete } from '../../../peregrine/talons/AutoComplete/useAutoComplete';
import defaultClasses from '../AutoComplete/autoComplete.module.css';
import SearchField from '../AutoComplete/searchField';
import SearchSuggestion from './searchSuggestion';

const StoreLocatorSearchBox = (props) => {
    const { 
        searchBoxRef,
        data, 
        disableLabel,
        field,
        fieldConstraints = [],
        isOpen, 
        onPlacesChanged,
        ...fieldProps
    } = props;
    const talonProps = useAutoComplete();
    const {
        containerRef,
        handleChange,
        handleFocus,
        isAutoCompleteOpen,
        setIsAutoCompleteOpen,
        valid
    } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);
    
    return (
        <div className={classes.root_open} ref={searchBoxRef}>
            <div ref={containerRef} className={classes.container}>
                <div className={classes.autocomplete}>
                    <SearchSuggestion
                        data={data}
                        fieldInput={field}
                        fieldInputConstraints={fieldConstraints}
                        onPlacesChanged={onPlacesChanged}
                        setVisible={setIsAutoCompleteOpen}
                        valid={valid}
                        visible={isAutoCompleteOpen}
                        />
                </div>
                <div className={classes.search}>
                    <SearchField
                        fieldInput={field}
                        fieldInputConstraints={fieldConstraints}
                        isSearchOpen={isOpen}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        {...fieldProps}
                    />
                </div>
            </div>
        </div>
    );
};

export default StoreLocatorSearchBox;

StoreLocatorSearchBox.propTypes = {
    classes: shape({
        autocomplete: string,
        container: string,
        form: string,
        root: string,
        root_open: string,
        search: string
    }),
    isOpen: bool
};