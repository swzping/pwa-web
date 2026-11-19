import React, { useMemo } from 'react';
import { bool, func, shape, string, arrayOf } from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { Search as SearchIcon } from 'react-feather';

import { useStyle } from '@magento/venia-ui/lib/classify';
import FilterSection from './filterSection';
import FilterChip from './filterChip';
import OptionRow from './optionRow';
import useFilterSectionState from './useFilterSectionState';
import defaultClasses from './chipListSection.module.css';

const VISIBLE_LIMIT = 6;

/**
 * Checkbox-list section renderer, ported from the app's
 * ChipListSection: optional client-side search box +
 * option rows + show more/less toggle. While a search
 * text is active the visible limit is lifted so every
 * match is shown. Single-select facets replace the
 * previous pick instead of accumulating.
 */
const ChipListSection = ({
    label,
    items,
    selectedSet,
    onToggle,
    onSelectSingle,
    singleSelect = false,
    searchable = true,
    showMoreVariant = 'count',
    // "rows" = checkbox list (desktop sidebar default);
    // "chips" = app-parity pill wrap (H5 sheet)
    variant = 'rows',
    defaultExpanded = false,
    isLast = false,
    classes: propsClasses,
}) => {
    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses, propsClasses);
    const sectionState = useFilterSectionState({
        defaultExpanded,
        hasSelection: !!(selectedSet && selectedSet.size > 0),
    });
    const { expanded, toggleExpanded, searchText, setSearchText, showAll, setShowAll } = sectionState;

    const { matches, shown } = useMemo(() => {
        const list = items || [];
        const query = searchText.trim().toLowerCase();
        const filtered = query
            ? list.filter(option =>
                  String(option?.title || '')
                      .toLowerCase()
                      .includes(query),
              )
            : list;
        const limit = query || showAll ? filtered.length : VISIBLE_LIMIT;
        return {
            matches: filtered,
            shown: filtered.slice(0, limit),
        };
    }, [items, searchText, showAll]);

    const totalCount = matches.length;
    const hiddenCount = Math.max(totalCount - shown.length, 0);

    const handleOptionPress = option => {
        if (singleSelect && !selectedSet?.has(option)) {
            // single-select facet: picking one replaces the
            // previous pick (PRD: Promotion is single-select)
            onSelectSingle(option);
        } else {
            onToggle(option);
        }
    };

    const searchPlaceholder = formatMessage(
        {
            id: 'filterSection.searchPlaceholder',
            defaultMessage: 'Search {label}',
        },
        { label: label || '' },
    );

    return (
        <FilterSection label={label} expanded={expanded} onToggleExpanded={toggleExpanded} isLast={isLast}>
            {searchable ? (
                <div className={classes.searchBox}>
                    <SearchIcon className={classes.searchIcon} />
                    <input
                        type="text"
                        className={classes.searchInput}
                        value={searchText}
                        onChange={event => setSearchText(event.target.value)}
                        placeholder={searchPlaceholder}
                        autoCapitalize="none"
                    />
                </div>
            ) : null}
            {variant === 'chips' ? (
                <div className={classes.chipsWrap}>
                    {shown.map(option => (
                        <FilterChip
                            key={option.value}
                            label={option.title}
                            selected={!!selectedSet?.has(option)}
                            onPress={() => handleOptionPress(option)}
                        />
                    ))}
                    {shown.length === 0 ? (
                        <span className={classes.noOptions}>
                            <FormattedMessage id={'filterSection.noOptions'} defaultMessage={'No options'} />
                        </span>
                    ) : null}
                </div>
            ) : (
                <ul className={classes.options}>
                    {shown.map(option => (
                        <li key={option.value} className={classes.option}>
                            <OptionRow
                                label={option.title}
                                checked={!!selectedSet?.has(option)}
                                onToggle={() => handleOptionPress(option)}
                            />
                        </li>
                    ))}
                    {shown.length === 0 ? (
                        <li className={classes.noOptions}>
                            <FormattedMessage id={'filterSection.noOptions'} defaultMessage={'No options'} />
                        </li>
                    ) : null}
                </ul>
            )}
            {!searchText && hiddenCount > 0 ? (
                <button type="button" className={classes.showMoreLink} onClick={() => setShowAll(true)}>
                    {showMoreVariant === 'simple' ? (
                        <FormattedMessage id={'filterSection.showAll'} defaultMessage={'Show All'} />
                    ) : (
                        <FormattedMessage
                            id={'filterSection.showMoreCount'}
                            defaultMessage={'Show more({count})'}
                            values={{ count: totalCount }}
                        />
                    )}
                </button>
            ) : null}
            {!searchText && showAll && matches.length > VISIBLE_LIMIT ? (
                <button type="button" className={classes.showMoreLink} onClick={() => setShowAll(false)}>
                    {showMoreVariant === 'simple' ? (
                        <FormattedMessage id={'filterSection.showLess'} defaultMessage={'Show Less'} />
                    ) : (
                        <FormattedMessage
                            id={'filterSection.showLessCount'}
                            defaultMessage={'Show less({count})'}
                            values={{ count: totalCount }}
                        />
                    )}
                </button>
            ) : null}
        </FilterSection>
    );
};

ChipListSection.propTypes = {
    label: string,
    items: arrayOf(shape({ title: string, value: string })),
    selectedSet: shape({ has: func }),
    onToggle: func.isRequired,
    onSelectSingle: func,
    singleSelect: bool,
    searchable: bool,
    showMoreVariant: string,
    variant: string,
    defaultExpanded: bool,
    isLast: bool,
    classes: shape({
        searchBox: string,
        searchIcon: string,
        searchInput: string,
        chipsWrap: string,
        options: string,
        option: string,
        noOptions: string,
        showMoreLink: string,
    }),
};

export default ChipListSection;
