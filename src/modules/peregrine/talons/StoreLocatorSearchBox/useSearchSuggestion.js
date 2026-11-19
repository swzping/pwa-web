import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormApi, useFieldState } from 'informed';
import debounce from 'lodash.debounce';

/**
 * Returns props necessary to render an Autocomplete component.
 * @param {Object} props
 * @param {String} props.fieldInput - name of field
 * @param {Function} props.setVisible
 * @param {Boolean} props.valid
 * @param {Boolean} props.visible - whether to show the element
 */
export const useSearchSuggestion = props => {
    const {
        data,
        fieldInput,
        fieldInputConstraints,
        onPlacesChanged,
        setVisible,
        valid,
        visible,
    } = props;

    // Get the search term from the field.
    const formApi = useFormApi();
    const { value } = useFieldState(fieldInput);

    const [dataFiltered, setDataFiltered] = useState([]);

    const handleSelectSuggestion = useCallback(
        (selectedItem) => {
            const selectedStore = data.find((store) => {
                return store.storepickup_id === selectedItem;
            });
            const target = {
                lat: Number(selectedStore.lat),
                lng: Number(selectedStore.lng),
                info: selectedStore.info,
            }

            if (fieldInputConstraints.length > 0) {
                fieldInputConstraints.forEach(field => formApi.setValue(field, ''));
            }

            onPlacesChanged(selectedStore && selectedStore.store_name, target);

            setVisible(false);
        },
        [fieldInput],
    );

    // Prepare to run the queries.
    const runSearch = useCallback(
        (query) => {
            setDataFiltered([...data.filter(({ info }) => {
                return info.toLowerCase().includes(query.toLowerCase())
            })]);
        },
        [setDataFiltered],
    )

    // Create a debounced function so we only search some delay after the last
    // keypress.
    const debouncedRunQuery = useMemo(
        () =>
            debounce(inputText => {
                runSearch(inputText);
            }, 500),
        [runSearch]
    );

    // run the query once on mount, and again whenever state changes
    useEffect(() => {
        if (valid && visible) {
            debouncedRunQuery(value);
        }
    }, [debouncedRunQuery, valid, value, visible]);

    // Handle results.
    const filters = { name: { eq: value }};
    const hasResult = typeof value === 'undefined' ? data.length > 0 : dataFiltered.length > 0;
    const resultCount = typeof value === 'undefined' ? data.length : dataFiltered.length;
    const displayResult = valid && hasResult;
    const invalidCharacterLength = !valid && value ? true : false;
    let messageType = '';

    if (invalidCharacterLength) {
        messageType = 'INVALID_CHARACTER_LENGTH';
    } else if (!displayResult) {
        messageType = 'PROMPT';
    } else if (!resultCount) {
        messageType = 'EMPTY_RESULT';
    } else {
        messageType = 'RESULT_SUMMARY';
    }

    return {
        displayResult,
        dataFiltered: typeof value === 'undefined' ? data : dataFiltered,
        filters,
        handleSelectSuggestion,
        messageType,
        resultCount,
        value
    };
};
