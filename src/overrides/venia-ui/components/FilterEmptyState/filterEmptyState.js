import React from 'react';
import { FormattedMessage } from 'react-intl';
import { shape, string } from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { clearFiltersFromSearch } from '../../../../modules/plp-filter/filterPayload';
import defaultClasses from './filterEmptyState.module.css';

/**
 * Open-carton box illustration for the empty state —
 * the app's EmptyBox svg (override/assets/svgs/EmptyBox)
 * ported to DOM svg: soft orange fill behind dark
 * line-art box edges.
 */
const EmptyBoxIcon = props => (
    <svg width="96" height="96" viewBox="38 13 92 70" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path
            opacity="0.7"
            d="M124.152 40.3341L117.825 32.2647C117.317 31.6192 116.72 31.0511 116.06 30.5734H116.064H116.057C115.309 30.0343 114.483 29.605 113.594 29.3178L88.9899 22.0295C87.1859 21.442 85.2375 21.442 83.4302 22.0295L57.557 29.3145C56.6616 29.605 55.8252 30.0375 55.0773 30.583H55.0708H55.074C54.418 31.0607 53.8276 31.6224 53.3258 32.2647L46.9985 40.3341C46.3195 41.2024 46.6935 42.4677 47.7431 42.8389L54.9855 45.4049V65.4074C54.9855 66.3822 55.6218 67.2472 56.5599 67.5539L82.7972 76.0945C84.6045 76.682 86.5528 76.682 88.3601 76.0945L114.601 67.5539C115.542 67.2472 116.175 66.3822 116.175 65.4074V45.4049L123.414 42.8421C124.461 42.4709 124.838 41.2056 124.159 40.3373L124.152 40.3341Z"
            fill="#FFC080"
        />
        <path
            d="M112.651 42.252V62.1799C112.651 63.1511 112.028 64.0129 111.107 64.3179L85.3815 72.8267C83.6114 73.4134 81.6988 73.4134 79.9288 72.8267L54.2068 64.3179C53.2853 64.0129 52.6621 63.1511 52.6621 62.1799V42.252"
            stroke="#424242"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M82.6572 36.5498V73.2634"
            stroke="#424242"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M90.3075 20.5586L110.123 26.2201C111.767 26.7637 113.212 27.7879 114.273 29.1602L120.475 37.1984C121.141 38.0635 120.773 39.3231 119.745 39.6943L94.0299 48.949C93.1018 49.2838 92.0677 48.9755 91.4743 48.1899L82.6572 36.5454"
            stroke="#424242"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M58.1077 44.2102L45.5649 39.6956C44.5374 39.3277 44.1694 38.0648 44.8357 37.1996L51.0375 29.1615C52.0949 27.7892 53.5401 26.765 55.1875 26.2214L80.5283 19.4262C82.8519 18.8163 84.3502 18.8859 86.392 19.4759"
            stroke="#424242"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M82.6566 36.5498L73.8395 48.1943C73.2462 48.9799 72.2087 49.2882 71.2839 48.9534L62.5762 45.8177"
            stroke="#424242"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M52.748 27.4869L80.028 36.1416C81.7384 36.6852 83.5747 36.6852 85.2851 36.1416L112.549 27.4736"
            stroke="#424242"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/**
 * Empty-results state, ported from the app's PLP
 * EmptyElement (product_list/_view.js): box icon, "No
 * products match your filters" and a "Clear all filters"
 * outlined button. Rendering it is the caller's choice —
 * only show this when the URL carries applied filters,
 * otherwise keep the stock empty views. Clearing rewrites
 * the URL without any `code[filter]` param (the same
 * source of truth the filter panel and sidebar write to),
 * so the page refetches unfiltered.
 */
const FilterEmptyState = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const history = useHistory();
    const { pathname, search } = useLocation();

    const handleClearFilters = () => {
        history.push({ pathname, search: clearFiltersFromSearch(search) });
    };

    return (
        <div className={classes.root}>
            <EmptyBoxIcon className={classes.icon} />
            <p className={classes.message}>
                <FormattedMessage
                    id={'filterEmptyState.noProductsMatch'}
                    defaultMessage={'No products match your filters'}
                />
            </p>
            <button type="button" className={classes.button} onClick={handleClearFilters}>
                <FormattedMessage id={'filterEmptyState.clearAllFilters'} defaultMessage={'Clear all filters'} />
            </button>
        </div>
    );
};

FilterEmptyState.propTypes = {
    classes: shape({
        root: string,
        icon: string,
        message: string,
        button: string,
    }),
};

export default FilterEmptyState;
