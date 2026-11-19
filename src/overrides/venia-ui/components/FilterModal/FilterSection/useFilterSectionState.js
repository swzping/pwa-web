import { useCallback, useEffect, useState } from 'react';

/**
 * Per-section transient UI state for the filter panel
 * sections (expanded + in-section search + show-all).
 * Collapsing a section forgets its search text and
 * show-all state — app parity (ChipListSection).
 */
export const useFilterSectionState = ({ defaultExpanded = false, hasSelection = false } = {}) => {
    const [expandedState, setExpandedState] = useState(defaultExpanded);
    const [searchText, setSearchText] = useState('');
    const [showAll, setShowAll] = useState(false);

    // 有选中值的组保持展开（H5 需求）：派生值优先于本地状态，
    // 因此草稿晚一拍注入（抽屉打开后才 reseed）时也能即时展开。
    const expanded = expandedState || hasSelection;

    const toggleExpanded = useCallback(() => setExpandedState(value => !value), []);

    useEffect(() => {
        if (!expanded) {
            setSearchText('');
            setShowAll(false);
        }
    }, [expanded]);

    return {
        expanded,
        toggleExpanded,
        searchText,
        setSearchText,
        showAll,
        setShowAll,
    };
};

export default useFilterSectionState;
