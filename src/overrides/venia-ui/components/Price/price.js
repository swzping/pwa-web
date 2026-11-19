import React, { Fragment } from 'react';
import { number, string, shape } from 'prop-types';
import { useIntl } from 'react-intl';
import patches from '@magento/peregrine/lib/util/intlPatches';

/**
 * The **Price** component is used anywhere a price needs to be displayed.
 *
 * Formatting of prices and currency symbol selection is handled entirely by the ECMAScript Internationalization API available in modern browsers.
 *
 * A [polyfill][] is required for any JavaScript runtime that does not have [Intl.NumberFormat.prototype.formatToParts][].
 *
 * [polyfill]: https://www.npmjs.com/package/intl
 * [Intl.NumberFormat.prototype.formatToParts]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
 */

const Price = props => {
    const { locale } = useIntl();
    const { value, currencyCode, classes } = props;

    const parts = patches.toParts.call(
        new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode
        }),
        value
    );

    const currencyPart = parts.find(part => part.type === 'currency');
    const amountParts = parts.filter(part => part.type !== 'currency' && part.type !== 'literal');
    const separator = parts.some(part => part.type === 'literal') ? ' ' : '';
    const currency = currencyPart ? currencyPart.value : 'IDR';
    const amount = amountParts.map(part => part.value).join('');

    return (
        <Fragment>
            <span className={classes.currency}>{currency}</span>
            {separator ? <span>{separator}</span> : ''}
            <span className={classes.integer}>{amount}</span>
        </Fragment>
    );
};

Price.propTypes = {
    /**
     * Class names to use when styling this component
     */
    classes: shape({
        currency: string,
        integer: string,
        decimal: string,
        fraction: string
    }),
    /**
     * The numeric price
     */
    value: number.isRequired,
    /**
     * A string with any of the currency code supported by Intl.NumberFormat
     */
    currencyCode: string.isRequired
};

Price.defaultProps = {
    classes: {}
};

export default Price;
