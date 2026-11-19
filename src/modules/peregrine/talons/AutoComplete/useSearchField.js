import { useCallback, useEffect, useRef } from 'react';
import { useFormApi, useFieldState } from 'informed';

/**
 * Returns props necessary to render a SearchField component.
 */
export const useSearchField = props => {
    const {
        fieldInput,
        fieldInputConstraints,
        isSearchOpen
    } = props;

    const inputRef = useRef();
    const formApi = useFormApi();
    const { value } = useFieldState(fieldInput);

    const resetField = useCallback(() => {
        formApi.setValue(fieldInput, '');

        if (fieldInputConstraints.length > 0) {
            fieldInputConstraints.forEach(field => formApi.setValue(field, ''));
        }

    }, [formApi, fieldInput, fieldInputConstraints]);

    // When the search field is opened focus on the input.
    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearchOpen]);

    return {
        inputRef,
        resetField,
        value
    };
};
