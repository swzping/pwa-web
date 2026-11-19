import React, { useEffect, useMemo, useState } from 'react';
import { bool, func, number, shape, string, arrayOf } from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { getTrackBackground, Range } from 'react-range';

import { useStyle } from '@magento/venia-ui/lib/classify';
import FilterSection from './filterSection';
import useFilterSectionState from './useFilterSectionState';
import { parseDraftPrice } from '../../../../../modules/plp-filter/filterRenderers';
import defaultClasses from './priceRangeSection.module.css';

const SLIDER_STEP = 1000;

/**
 * Comma-grouped display ("1,500,000") for the price
 * inputs only — mirrors the app's
 * `numberFormat('', value, ',', 0)` grouping (same
 * `\B(?=(\d{3})+(?!\d))` regex). Editing shows the raw
 * digits (grouping only when not editing, app parity);
 * formatIdr stays dot-grouped for delimiter-safe filter
 * titles. No Number() round-trip, so long inputs never
 * lose precision.
 */
const groupWithCommas = digits => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Price section renderer, ported from the app's
 * PriceRangeSection: min/max inputs ("Rp" prefix, "to"
 * between) + an optional dual-thumb slider,
 * bidirectionally synced. Strict mapping: the left thumb
 * always drives the left (min) input, the right thumb the
 * right (max) input — values are clamped against each
 * other, never swapped. Typing pushes a clamped live
 * range; blur commits the final clamp. While not focused
 * the display derives from the incoming value.
 *
 * Commit timing belongs to the shell: the H5 sheet calls
 * `onApply` live (writes the draft), the desktop sidebar
 * shows Reset/Go and only calls `onApply` on Go.
 */
const PriceRangeSection = ({
    label,
    bounds,
    value,
    onApply,
    onReset,
    showSlider = true,
    withActions = false,
    defaultExpanded = false,
    isLast = false,
    classes: propsClasses,
}) => {
    const classes = useStyle(defaultClasses, propsClasses);
    const { expanded, toggleExpanded } = useFilterSectionState({
        defaultExpanded,
        hasSelection: (value || []).length > 0,
    });

    const [minText, setMinText] = useState(null); // null = not editing
    const [maxText, setMaxText] = useState(null);
    const [range, setRange] = useState(() => parseDraftPrice(value, bounds));

    const valueKey = useMemo(() => (value || []).join('_'), [value]);

    // outside changes (apply/reset from elsewhere) re-derive the range
    useEffect(() => {
        setRange(parseDraftPrice(value, bounds));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valueKey, bounds.min, bounds.max]);

    const clampTo = boundValue => Math.min(Math.max(boundValue, bounds.min), bounds.max);

    // live linkage while typing: move only the edited side,
    // clamped against the other one — never swapped
    const pushLive = (side, digits) => {
        setRange(current => {
            const [currentLo, currentHi] = current;
            if (side === 'min') {
                const raw = digits === '' ? bounds.min : clampTo(Number(digits));
                return [Math.min(raw, currentHi), currentHi];
            }
            const raw = digits === '' ? bounds.max : clampTo(Number(digits));
            return [currentLo, Math.max(raw, currentLo)];
        });
    };

    const startEditing = side => {
        const [currentLo, currentHi] = range;
        if (side === 'min') {
            setMinText(currentLo === bounds.min ? '' : String(currentLo));
        } else {
            setMaxText(currentHi === bounds.max ? '' : String(currentHi));
        }
    };

    const commit = () => {
        if (minText === null && maxText === null) {
            return;
        }
        // null text = side untouched this round: keep its value
        const rawLo = minText === null ? range[0] : minText === '' ? bounds.min : Number(minText);
        const rawHi = maxText === null ? range[1] : maxText === '' ? bounds.max : Number(maxText);
        const lo = clampTo(Number.isFinite(rawLo) ? rawLo : bounds.min);
        const hi = clampTo(Number.isFinite(rawHi) ? rawHi : bounds.max);
        const next = [Math.min(lo, hi), Math.max(lo, hi)];
        setRange(next);
        setMinText(null);
        setMaxText(null);
        if (!withActions) {
            onApply(next);
        }
    };

    // a thumb release wins over any in-progress text editing:
    // drop the local text so the focused input re-derives
    // from the range, and the later blur commit becomes a no-op
    const onSliderChange = values => {
        setMinText(null);
        setMaxText(null);
        setRange(values);
    };

    const onSliderFinalChange = values => {
        setMinText(null);
        setMaxText(null);
        setRange(values);
        onApply(values);
    };

    const handleGo = () => {
        setMinText(null);
        setMaxText(null);
        onApply(range);
    };

    const handleReset = () => {
        setMinText(null);
        setMaxText(null);
        setRange([bounds.min, bounds.max]);
        onReset?.();
    };

    const digitsOnly = text => text.replace(/[^0-9]/g, '');

    // a price draft exists (app parity: show the applied
    // numbers as-is — "0" included — instead of the old
    // hide-at-bound comparison)
    const hasRange = (value || []).length > 0;

    // Per-side not-editing display: min shows whenever a
    // draft is applied (app parity: "0" included) or the
    // local range moved off bounds.min; max only leaves its
    // placeholder once it sits off the bounds.max sentinel —
    // so typing just the min never materializes the max
    // ("50000_max" drafts keep "Highest price" empty)
    const showMin = hasRange || range[0] !== bounds.min;
    const showMax = range[1] !== bounds.max;

    const inputValue = side => {
        if (side === 'min') {
            if (minText !== null) return minText;
            return showMin ? groupWithCommas(String(range[0])) : '';
        }
        if (maxText !== null) return maxText;
        return showMax ? groupWithCommas(String(range[1])) : '';
    };

    const renderTrack = useMemo(
        () => ({ props, children }) => (
            <div
                role="presentation"
                onMouseDown={props.onMouseDown}
                onTouchStart={props.onTouchStart}
                style={{
                    ...props.style,
                    height: '36px',
                    display: 'flex',
                    width: '100%',
                }}
            >
                <div
                    ref={props.ref}
                    style={{
                        height: '4px',
                        width: '100%',
                        borderRadius: '2px',
                        background: getTrackBackground({
                            values: range,
                            colors: ['#E0E0E0', 'var(--color-primary)', '#E0E0E0'],
                            min: bounds.min,
                            max: bounds.max,
                        }),
                        alignSelf: 'center',
                    }}
                >
                    {children}
                </div>
            </div>
        ),
        [range, bounds.min, bounds.max],
    );

    const renderThumb = useMemo(
        () => ({ props }) => (
            <div
                {...props}
                style={{
                    ...props.style,
                    height: '20px',
                    width: '20px',
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: 50,
                    border: '2px solid #fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
            />
        ),
        [],
    );

    return (
        <FilterSection label={label} expanded={expanded} onToggleExpanded={toggleExpanded} isLast={isLast}>
            <div className={classes.inputsRow}>
                <span className={classes.currencyText}>Rp</span>
                <div className={classes.inputBox}>
                    <span className={classes.currency}>IDR</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        className={classes.input}
                        value={inputValue('min')}
                        onChange={event => {
                            const digits = digitsOnly(event.target.value);
                            setMinText(digits);
                            pushLive('min', digits);
                        }}
                        onFocus={() => startEditing('min')}
                        onBlur={commit}
                        placeholder="Lowest price"
                    />
                </div>
                <span className={classes.to}>
                    <FormattedMessage id={'filterSection.priceTo'} defaultMessage={'to'} />
                </span>
                <div className={classes.inputBox}>
                    <span className={classes.currency}>IDR</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        className={classes.input}
                        value={inputValue('max')}
                        onChange={event => {
                            const digits = digitsOnly(event.target.value);
                            setMaxText(digits);
                            pushLive('max', digits);
                        }}
                        onFocus={() => startEditing('max')}
                        onBlur={commit}
                        placeholder="Highest price"
                    />
                </div>
            </div>
            {showSlider ? (
                <div className={classes.slider}>
                    <Range
                        min={bounds.min}
                        max={bounds.max}
                        step={SLIDER_STEP}
                        values={range}
                        onChange={onSliderChange}
                        onFinalChange={onSliderFinalChange}
                        renderTrack={renderTrack}
                        renderThumb={renderThumb}
                    />
                </div>
            ) : null}
            {withActions ? (
                <div className={classes.actions}>
                    <button type="button" className={classes.resetButton} onClick={handleReset}>
                        <FormattedMessage id={'filterSection.priceReset'} defaultMessage={'Reset'} />
                    </button>
                    <button type="button" className={classes.goButton} onClick={handleGo}>
                        <FormattedMessage id={'filterSection.priceGo'} defaultMessage={'Go'} />
                    </button>
                </div>
            ) : null}
        </FilterSection>
    );
};

PriceRangeSection.propTypes = {
    label: string,
    bounds: shape({ min: number, max: number }),
    value: arrayOf(string),
    onApply: func.isRequired,
    onReset: func,
    showSlider: bool,
    withActions: bool,
    defaultExpanded: bool,
    isLast: bool,
    classes: shape({
        inputsRow: string,
        inputBox: string,
        currency: string,
        input: string,
        to: string,
        slider: string,
        actions: string,
        resetButton: string,
        goButton: string,
    }),
};

export default PriceRangeSection;
