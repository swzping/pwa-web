import React from 'react';
import defaultClasses from './index.module.css';
import { useSimpleCountdown } from './useCountdown';
import { useStyle } from '@magento/venia-ui/lib/classify';

export const CountDown = ({specialFromDate, specialToDate}) => {
    const countdown = useSimpleCountdown(specialFromDate, specialToDate);
    return <CountdownDisplay countdown={countdown} />;
};

export const CountdownDisplay = ({ countdown, classes: propClasses }) => {
    const classes = useStyle(defaultClasses, propClasses);
    const { hours, minutes, seconds } = countdown;
    return (
        <div className={classes.wrap}>
            <img alt="Flash Sale" src='/venia-static-assets/images/newFlash.png' />
            <div className={classes.wrapEnd}>
                <span className={classes.endText}>Ends In</span>
                <span className={classes.num}>{hours}</span>
                <span className={classes.gap}>:</span>
                <span className={classes.num}>{minutes}</span>
                <span className={classes.gap}>:</span>
                <span className={classes.num}>{seconds}</span>
            </div>
        </div>
    );
};
