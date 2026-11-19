import React, { useCallback, useMemo, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { array, arrayOf, bool, number, shape, string } from 'prop-types';
import { useFilterSidebar } from '@magento/peregrine/lib/talons/FilterSidebar';

import { useStyle } from '@magento/venia-ui/lib/classify';
import CurrentFilters from '@magento/venia-ui/lib/components/FilterModal/CurrentFilters';
import { BooleanRow, ChipListSection, PriceRangeSection } from '../FilterModal/FilterSection';
import { RENDERER, buildFilterSections, draftPriceFromRange } from '../../../../modules/plp-filter/filterRenderers';
import { priceItemTitle } from '../../../../modules/plp-filter/filterPayload';
import defaultClasses from './filterSidebar.module.css';

const SCROLL_OFFSET = 150;

/**
 * Desktop filter sidebar (>= 768px), modelled on the
 * reference design: "Filter" + "Clear all" header,
 * collapsible sections (price inputs with Reset/Go,
 * searchable checkbox lists with Show All), then the
 * standalone boolean rows. Every interaction applies
 * immediately — there is no Apply step.
 *
 * @param {Object} props.filters - filters to display
 */
const FilterSidebar = props => {
    const { filters, isSearch = false } = props;
    const { formatMessage } = useIntl();
    const talonProps = useFilterSidebar({ filters });
    const { filterApi, filterItems, filterNames, filterState, applyGroupValues, handleApply, handleReset } = talonProps;

    const filterRef = useRef();
    const classes = useStyle(defaultClasses, props.classes);

    // scroll the sidebar into view after an interaction,
    // then commit (existing behavior for checkbox toggles)
    const applyWithScroll = useCallback(
        (...args) => {
            const filterElement = filterRef.current;
            if (filterElement && typeof filterElement.getBoundingClientRect === 'function') {
                const filterTop = filterElement.getBoundingClientRect().top;
                const windowScrollY = window.scrollY + filterTop - SCROLL_OFFSET;
                window.scrollTo(0, windowScrollY);
            }

            handleApply(...args);
        },
        [handleApply, filterRef],
    );

    const categoryLabel = formatMessage({
        id: 'filterSection.category',
        defaultMessage: 'Category',
    });

    const sections = useMemo(() => buildFilterSections(filters, { isSearch, categoryLabel }), [
        filters,
        isSearch,
        categoryLabel,
    ]);

    const listSections = sections.filter(section => section.rendererType !== RENDERER.BOOLEAN);
    const booleanSections = sections.filter(section => section.rendererType === RENDERER.BOOLEAN);

    const renderSidebarSection = (section, index) => {
        const items = filterItems.get(section.attribute_code) || [];
        const selected = filterState.get(section.attribute_code);
        const group = section.attribute_code;
        const isLast = index === listSections.length - 1;
        const key = `${group}:${isSearch ? 'search' : 'category'}`;

        if (section.rendererType === RENDERER.PRICE) {
            const bounds = section.priceBounds;
            const values = selected ? Array.from(selected).map(item => item.value) : [];

            return (
                <PriceRangeSection
                    key={key}
                    label={section.label}
                    bounds={bounds}
                    value={values}
                    showSlider={false}
                    withActions={true}
                    defaultExpanded={true}
                    isLast={isLast}
                    onApply={range => {
                        const appliedValues = draftPriceFromRange(range, bounds);
                        const nextItems = appliedValues.length
                            ? [
                                  {
                                      title: priceItemTitle(
                                          ...String(appliedValues[0])
                                              .split('_')
                                              .map(Number),
                                      ),
                                      value: appliedValues[0],
                                  },
                              ]
                            : [];
                        applyGroupValues(group, nextItems);
                    }}
                    onReset={() => applyGroupValues(group, [])}
                />
            );
        }

        return (
            <ChipListSection
                key={key}
                label={section.label}
                items={items}
                selectedSet={selected}
                onToggle={item => {
                    filterApi.toggleItem({ group, item });
                    applyWithScroll();
                }}
                onSelectSingle={item => {
                    applyGroupValues(group, [item]);
                    applyWithScroll();
                }}
                singleSelect={section.singleSelect}
                searchable={section.rendererType === RENDERER.SEARCHABLE_CHIPS}
                showMoreVariant="simple"
                defaultExpanded={true}
                isLast={isLast}
            />
        );
    };

    const renderBooleanRow = section => {
        const items = filterItems.get(section.attribute_code) || [];
        const selected = filterState.get(section.attribute_code);
        const group = section.attribute_code;
        const booleanItem = items.find(item => String(item.value) === '1') || {
            title: section.label,
            value: '1',
        };

        // Membership BY VALUE, not item identity: facets whose
        // aggregation lacks a '1' option (e.g. halal_indicator)
        // fall back to a literal recreated on every render, so a
        // Set.has(reference) check never turns true and each click
        // keeps adding a duplicate entry. (Same fix as the H5
        // sheet's boolean sections.)
        const checked = !!(selected && [...selected].some(item => String(item.value) === '1'));

        return (
            <BooleanRow
                key={group}
                label={section.label}
                checked={checked}
                onToggle={() => {
                    if (checked) {
                        // the boolean group only ever holds the '1'
                        // value — dropping the group is the off
                        // switch (also clears duplicates that
                        // identity-based toggles left behind)
                        filterApi.removeGroup({ group });
                    } else {
                        filterApi.addItem({ group, item: booleanItem });
                    }
                    applyWithScroll();
                }}
            />
        );
    };

    return (
        <aside className={classes.root} ref={filterRef} aria-live="polite" aria-busy="false">
            <div className={classes.body}>
                <div className={classes.filterWrapper}>
                    <h2 className={classes.filterTitle}>
                        <FormattedMessage id={'filterModal.headerTitle'} defaultMessage={'Filter'} />
                        <div className={classes.action}>
                            <button
                                type="button"
                                className={classes.clearAllButton}
                                onClick={handleReset}
                                disabled={!filterState.size}
                            >
                                <FormattedMessage id={'filterModal.action'} defaultMessage={'Clear all'} />
                            </button>
                        </div>
                    </h2>
                    {filterState.size ? (
                        <CurrentFilters
                            filterApi={filterApi}
                            filterNames={filterNames}
                            filterState={filterState}
                            onRemove={applyWithScroll}
                        />
                    ) : null}
                </div>
                <ul className={classes.blocks}>{listSections.map(renderSidebarSection)}</ul>
                {booleanSections.length ? (
                    <ul className={classes.booleanList}>{booleanSections.map(renderBooleanRow)}</ul>
                ) : null}
            </div>
        </aside>
    );
};

FilterSidebar.defaultProps = {
    isSearch: false,
};

FilterSidebar.propTypes = {
    classes: shape({
        action: string,
        blocks: string,
        body: string,
        booleanList: string,
        clearAllButton: string,
        filterWrapper: string,
        filterTitle: string,
        root: string,
    }),
    filters: arrayOf(
        shape({
            attribute_code: string,
            items: array,
        }),
    ),
    isSearch: bool,
    filterCountToOpen: number,
};

export default FilterSidebar;
