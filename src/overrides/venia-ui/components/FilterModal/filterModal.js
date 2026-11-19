import React, { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { array, arrayOf, object, shape, string } from 'prop-types';
import { useFilterModal } from '@magento/peregrine/lib/talons/FilterModal';

import { useStyle } from '@magento/venia-ui/lib/classify';
import FilterFooter from './filterFooter';
import Popup from '../../../../modules/swift-pwa-ui/components/Popup';
import { ChipListSection, FilterSection, OptionRow, PriceRangeSection } from './FilterSection';
import { RENDERER, buildFilterSections, draftPriceFromRange } from '../../../../modules/plp-filter/filterRenderers';
import { priceItemTitle } from '../../../../modules/plp-filter/filterPayload';
import defaultClasses from './filterModal.module.css';

const FilterModal = props => {
    const { filters, pageContext } = props;
    const { formatMessage } = useIntl();
    const talonProps = useFilterModal({ filters, pageContext });
    const {
        filterItems,
        draftState,
        draftApi,
        draftFilterCount,
        isDraftCountLoading,
        handleApply,
        handleClose,
        handleReset,
        isOpen,
    } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);
    const isSearch = !!(pageContext && pageContext.isSearch);

    const categoryLabel = formatMessage({
        id: 'filterSection.category',
        defaultMessage: 'Category',
    });

    const sections = useMemo(() => buildFilterSections(filters, { isSearch, categoryLabel }), [
        filters,
        isSearch,
        categoryLabel,
    ]);

    const renderSection = (section, index) => {
        const items = filterItems.get(section.attribute_code) || [];
        const selected = draftState.get(section.attribute_code);
        const group = section.attribute_code;
        const isLast = index === sections.length - 1;
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
                    showSlider={true}
                    withActions={false}
                    isLast={isLast}
                    onApply={range => {
                        const draftValues = draftPriceFromRange(range, bounds);
                        draftApi.removeGroup({ group });
                        if (draftValues.length) {
                            const [lo, hi] = String(draftValues[0])
                                .split('_')
                                .map(Number);
                            draftApi.addItem({
                                group,
                                item: {
                                    title: priceItemTitle(lo, hi),
                                    value: draftValues[0],
                                },
                            });
                        }
                    }}
                />
            );
        }

        if (section.rendererType === RENDERER.BOOLEAN) {
            // non-expanding section: the checkbox sits in the
            // header, the header press toggles the '1' value
            const booleanItem = items.find(item => String(item.value) === '1') || {
                title: section.label,
                value: '1',
            };
            // Membership is checked BY VALUE, not by item identity:
            // facets whose aggregation lacks a '1' option (e.g.
            // halal_indicator) fall back to a literal recreated on
            // every render, so a Set.has(reference) check could
            // never turn true — and each click kept adding another
            // duplicate entry to the draft.
            const checked = !!(selected && [...selected].some(item => String(item.value) === '1'));

            return (
                <FilterSection
                    key={key}
                    label={section.label}
                    trailing={<OptionRow label="" ariaLabel={section.label} checked={checked} onToggle={() => {}} />}
                    onToggleExpanded={() => {
                        if (checked) {
                            // the boolean group only ever holds the '1'
                            // value — dropping the group is the off
                            // switch (also clears duplicates that
                            // identity-based toggles left behind)
                            draftApi.removeGroup({ group });
                        } else {
                            draftApi.addItem({ group, item: booleanItem });
                        }
                    }}
                    isLast={isLast}
                />
            );
        }

        return (
            <ChipListSection
                key={key}
                label={section.label}
                items={items}
                selectedSet={selected}
                onToggle={item => draftApi.toggleItem({ group, item })}
                onSelectSingle={item => {
                    const nextState = new Map(draftState);
                    nextState.set(group, new Set([item]));
                    draftApi.setItems(nextState);
                }}
                singleSelect={section.singleSelect}
                searchable={section.rendererType === RENDERER.SEARCHABLE_CHIPS}
                showMoreVariant="count"
                variant="chips"
                isLast={isLast}
            />
        );
    };

    const filtersList = useMemo(
        () => sections.map((section, index) => renderSection(section, index)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sections, filterItems, draftState, draftApi],
    );

    const filtersAriaLabel = formatMessage({
        id: 'filterModal.filters.ariaLabel',
        defaultMessage: 'Filters',
    });

    return (
        <Popup
            title={<FormattedMessage id={'filterModal.headerTitle'} defaultMessage={'Filter'} />}
            isOpen={isOpen}
            closeable={true}
            onClose={handleClose}
            position="bottom"
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '82%',
                overflow: 'hidden',
            }}
        >
            <div className={classes.body}>
                <ul className={classes.blocks} aria-label={filtersAriaLabel}>
                    {filtersList}
                </ul>
            </div>
            <FilterFooter
                applyFilters={handleApply}
                onClearAll={handleReset}
                draftCount={draftFilterCount}
                isCountLoading={isDraftCountLoading}
            />
        </Popup>
    );
};

FilterModal.propTypes = {
    classes: shape({
        action: string,
        blocks: string,
        body: string,
        header: string,
        headerTitle: string,
        root: string,
        root_open: string,
    }),
    filters: arrayOf(
        shape({
            attribute_code: string,
            items: array,
        }),
    ),
    pageContext: object,
};

export default FilterModal;
