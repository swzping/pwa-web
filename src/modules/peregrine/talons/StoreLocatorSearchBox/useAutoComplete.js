import { useCallback, useState } from 'react';

import { useDropdown } from '@magento/peregrine/lib/hooks/useDropdown';

export const useAutoComplete = () => {
    const [valid, setValid] = useState(false);
    const {
        elementRef,
        expanded: isAutoCompleteOpen,
        setExpanded: setIsAutoCompleteOpen
    } = useDropdown();

    // expand or collapse on input change
    const handleChange = useCallback(
        value => {
            const hasValue = !!value;
            const isValid = hasValue && value.length > 2;

            setValid(isValid);
            setIsAutoCompleteOpen(hasValue);
        },
        [setIsAutoCompleteOpen, setValid]
    );

    // expand on focus
    const handleFocus = useCallback(() => {
        setIsAutoCompleteOpen(true);
    }, [setIsAutoCompleteOpen]);

    return {
        containerRef: elementRef,
        handleChange,
        handleFocus,
        isAutoCompleteOpen,
        setIsAutoCompleteOpen,
        setValid,
        valid
    };
};
