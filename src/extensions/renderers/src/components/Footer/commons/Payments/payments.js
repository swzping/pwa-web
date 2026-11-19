import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './styles.module.css';

const Payments = () => {
    const classes = useStyle(defaultClasses);

    return (
        <ul className={classes.root}>
            <li>
                <div className={classes.rectangle}>
                    <img
                        src="/venia-static-assets/icons/payments/visa-logo.png"
                        width="60"
                    />
                </div>
            </li>
            <li>
                <div className={classes.rectangle}>
                    <img
                        src="/venia-static-assets/icons/payments/mastercard-logo.png"
                        width="60"
                    />
                </div>
            </li>
            <li>
                <div className={classes.rectangle}>
                    <img
                        src="/venia-static-assets/icons/payments/bri-logo.png"
                        width="60"
                    />
                </div>
            </li>
            <li>
                <div className={classes.rectangle}>
                    <img
                        src="/venia-static-assets/icons/payments/bca-logo.png"
                        width="60"
                    />
                </div>
            </li>
            <li>
                <div className={classes.rectangle}>
                    <img
                        src="/venia-static-assets/icons/payments/bni-logo.png"
                        width="60"
                    />
                </div>
            </li>
            <li>
                <div className={classes.rectangle}>
                    <img
                        src="/venia-static-assets/icons/payments/cimb-logo.png"
                        width="60"
                    />
                </div>
            </li>
            <li>
                <div className={classes.rectangle}>
                    <img
                        src="/venia-static-assets/icons/payments/mandiri-logo.png"
                        width="60"
                    />
                </div>
            </li>
        </ul>
    );
};

export default Payments;
