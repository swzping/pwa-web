import React, { useCallback } from 'react';
import { getTrackBackground, Range } from 'react-range';
import { useStyle } from '@magento/venia-ui/lib/classify';

import defaultClasses from './mapRadiusSlider.module.css';

const MIN = 1000;
const MAX = 100 * 1000;
const STEP = 1000;

const MapRadiusSlider = ({ values = [1000], onChange }) => {
    const classes = useStyle(defaultClasses);

    const renderTrack = useCallback(({ props, children }) => (
        <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            style={{
                ...props.style,
                height: '36px',
                display: 'flex',
                width: '100%'
            }}
        >
            <div
                ref={props.ref}
                style={{
                    height: '5px',
                    width: '100%',
                    borderRadius: '4px',
                    background: getTrackBackground({
                        values,
                        colors: ['black', '#ccc'],
                        min: MIN,
                        max: MAX,
                    }),
                    alignSelf: 'center'
                }}
            >
                {children}
            </div>
        </div>
    ), [values]);

    const renderThumb = useCallback(({ props }) => (
        <div
            {...props}
            style={{
                ...props.style,
                height: '12px',
                width: '12px',
                backgroundColor: 'black',
                borderRadius: 50,
                transform: 'translate(190.75px, -4px)'
            }}
        />
    ), []);

    return (
        <div className={classes.container}>
            <div className="label">
                {values / STEP} Km
                <span className="label--right">100 Km</span>
            </div>
            <Range
                min={MIN}
                max={MAX}
                onChange={(values) => onChange(values)}
                renderTrack={renderTrack}
                renderThumb={renderThumb}
                step={STEP}
                values={values}
            />
        </div>
  );
}

export default MapRadiusSlider;