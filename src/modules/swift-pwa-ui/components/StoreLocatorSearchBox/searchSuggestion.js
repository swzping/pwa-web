import React from 'react';
import { useIntl } from 'react-intl';
import { bool, func, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';

import { useSearchSuggestion } from '../../../peregrine/talons/StoreLocatorSearchBox/useSearchSuggestion';
import defaultClasses from './searchSuggestion.module.css';

const SearchSuggestion = props => {
    const { 
        data, 
        fieldInput,
        fieldInputConstraints = [], 
        onPlacesChanged,
        setVisible, 
        valid, 
        visible 
    } = props;
    const talonProps = useSearchSuggestion({
        data,
        fieldInput,
        fieldInputConstraints,
        onPlacesChanged,
        setVisible,
        valid,
        visible
    });
    const {
        dataFiltered,
        handleSelectSuggestion,
        messageType,
        resultCount,
    } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);
    const rootClassName = visible ? classes.root_visible : classes.root_hidden;

    const { formatMessage } = useIntl();
    const MESSAGES = new Map()
        .set(
            'ERROR',
            formatMessage({
                id: 'autocomplete.error',
                defaultMessage: 'An error occurred while fetching results.'
            })
        )
        .set(
            'LOADING',
            formatMessage({
                id: 'autocomplete.loading',
                defaultMessage: 'Fetching results...'
            })
        )
        .set(
            'PROMPT',
            formatMessage({
                id: 'autocomplete.promptData',
                defaultMessage: 'Search for a data'
            })
        )
        .set(
            'EMPTY_RESULT',
            formatMessage({
                id: 'autocomplete.emptyResult',
                defaultMessage: 'No results were found.'
            })
        )
        .set('RESULT_SUMMARY', (_, resultCount) =>
            formatMessage(
                {
                    id: 'autocomplete.resultSummary',
                    defaultMessage: '{resultCount} items'
                },
                { resultCount: resultCount }
            )
        )
        .set(
            'INVALID_CHARACTER_LENGTH',
            formatMessage({
                id: 'autocomplete.invalidCharacterLength',
                defaultMessage: 'Search term must be at least three characters'
            })
        );

    const messageTpl = MESSAGES.get(messageType);
    const message =
        typeof messageTpl === 'function'
            ? messageTpl`${resultCount}`
            : messageTpl;

    return (
        <div className={rootClassName}>
            <div className={classes.message}>{message}</div>
            <div className={classes.suggestions}>
                <ul className={classes.results}>
                    {dataFiltered.map(data => (
                        <li 
                            className={classes.item} 
                            key={data.storepickup_id}
                            onClickCapture={() => handleSelectSuggestion(data.storepickup_id)}
                        >
                            <span>{data.store_name}</span>
                            <br />
                            {`${data.city}, ${data.state}.`}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SearchSuggestion;

SearchSuggestion.propTypes = {
    classes: shape({
        message: string,
        root_hidden: string,
        root_visible: string,
        suggestions: string
    }),
    setVisible: func,
    visible: bool
};
