import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { shape, string, array, object } from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './filterModalOpenButton.module.css';
import { useFilterModal } from '@magento/peregrine/lib/talons/FilterModal';
import { FilterOutline } from '../../../../assets/icons';
import { countAppliedFromUrl } from '../../../../modules/plp-filter/filterPayload';

const FilterModalOpenButton = props => {
    const { filters, pageContext, classes: propsClasses } = props;
    const classes = useStyle(defaultClasses, propsClasses);
    const { handleOpen } = useFilterModal({ filters, pageContext });

    const { search } = useLocation();

    // the URL is the applied-state source of truth — counting
    // from it stays correct through modal drafts, sidebar
    // instant applies and quick-chip toggles
    const filterCount = useMemo(() => countAppliedFromUrl(search), [search]);
    const applied = filterCount > 0;

    // app parity: a plain pill (no venia Button chrome) —
    // icon + label tint/bold with the applied state, the
    // count sits flush after the label in bold brand color
    return (
        <button
            type="button"
            onClick={handleOpen}
            aria-live="polite"
            aria-busy="false"
            className={
                applied
                    ? `${classes.filterButton} ${classes.filterButtonApplied}`
                    : classes.filterButton
            }
        >
            <FilterOutline />
            <span className={classes.filterLabel}>
                <FormattedMessage id={'productList.filter'} defaultMessage={'Filter'} />
            </span>
            {applied && <span className={classes.filterNumber}>({filterCount})</span>}
        </button>
    );
};

FilterModalOpenButton.propTypes = {
    classes: shape({
        filterButton: string,
        filterButtonApplied: string,
        filterLabel: string,
        filterNumber: string,
    }),
    filters: array,
    pageContext: object,
};

export default FilterModalOpenButton;
