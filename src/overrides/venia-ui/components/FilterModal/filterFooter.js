import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { bool, func, number, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import defaultClasses from './filterFooter.module.css';

/**
 * H5 filter sheet footer: draft-only "Clear all" + "Apply".
 * While the sheet is open the Apply button carries a
 * debounced total-count preview ("Apply (N items)") that
 * degrades to plain "Apply" when the preview is loading
 * or unavailable.
 */
const FilterFooter = ({ applyFilters, onClearAll, draftCount, isCountLoading, classes: propsClasses }) => {
    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses, propsClasses);

    const applyLabel = isCountLoading
        ? formatMessage({
              id: 'filterModal.applyingCount',
              defaultMessage: 'Apply...',
          })
        : draftCount != null
        ? formatMessage(
              {
                  id: 'filterModal.applyCount',
                  defaultMessage: 'Apply ({count} items)',
              },
              { count: draftCount },
          )
        : formatMessage({ id: 'filterModal.apply', defaultMessage: 'Apply' });

    return (
        <div className={classes.root}>
            {/* app parity: Clear All stays enabled even with an
              empty draft (it just clears the draft in place) */}
            <Button
                priority={'normal'}
                onClick={onClearAll}
                type="button"
                aria-label={formatMessage({
                    id: 'filterModal.action.clearAll.ariaLabel',
                    defaultMessage: 'Clear all applied filters',
                })}
                className={classes.buttonClear}
            >
                <FormattedMessage id={'filterModal.action'} defaultMessage={'Clear all'} />
            </Button>
            <Button
                priority={'high'}
                onClick={applyFilters}
                type="button"
                aria-label={applyLabel}
                className={classes.buttonFilter}
            >
                {applyLabel}
            </Button>
        </div>
    );
};

FilterFooter.propTypes = {
    applyFilters: func.isRequired,
    onClearAll: func.isRequired,
    draftCount: number,
    isCountLoading: bool,
    classes: shape({
        root: string,
        buttonClear: string,
        buttonFilter: string,
    }),
};

export default FilterFooter;
