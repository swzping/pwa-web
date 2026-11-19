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
        setVisible,
        valid,
        visible,
    } = props;

    // Get the search term from the field.
    const formApi = useFormApi();
    const { value } = useFieldState(fieldInput);

    const [dataFiltered, setDataFiltered] = useState([]);
    const [filterProcess, setFilterProcess] = useState(false);

    const handleSelectSuggestion = useCallback(
        (selectedItem) => {
            formApi.setValue(fieldInput, selectedItem);
            if (fieldInputConstraints.length > 0) {
                fieldInputConstraints.forEach(field => formApi.setValue(field, ''));
            }

            setVisible(false);
        },
        [fieldInput],
    );

    // Prepare to run the queries.
    const runSearch = useCallback(
        (query) => {
            setDataFiltered([...data.filter(({ value }) => value.toLowerCase().includes(query.toLowerCase()))]);
        },
        [value],
    )

    // Create a debounced function so we only search some delay after the last
    // keypress.
    // const debouncedRunQuery = useMemo(
    //     () =>
    //         debounce(inputText => {
    //             runSearch(inputText);
    //         }, 500),
    //     [runSearch]
    // );
    const debouncedRunQuery = useMemo(
        () => {
            return (
                setFilterProcess(true),
                debounce(inputText => {
                    runSearch(inputText);
                    setFilterProcess(false);
                }, 500)
            )
        },
        [runSearch, setFilterProcess]
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

    const customValid = !!value;
    const hasValue = customValid && value.length > 2;

    // Clear text input if search autocomplete does not find result
    useEffect(() => {
        if (
            (fieldInput === 'city' || fieldInput === 'district' || fieldInput === 'subdistrict') 
            && hasValue && visible && !displayResult && !filterProcess
        ) {
            formApi.setValue(fieldInput, '');
        }
    }, [fieldInput, hasValue, visible, displayResult, filterProcess]);
    

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
