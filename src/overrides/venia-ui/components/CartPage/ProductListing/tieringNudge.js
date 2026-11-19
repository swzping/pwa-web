import React from 'react';
import PropTypes from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';

import defaultClasses from './productListing.module.css';

const TicketIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="27"
        height="20"
        viewBox="0 0 27 20"
        fill="none"
    >
        <path
            d="M14.629 1V3.52858M14.629 16.1715V18.7M14.629 8.58573V11.1143M1 6.05715C1.98581 6.05715 2.93125 6.45676 3.62832 7.16806C4.32539 7.87936 4.71701 8.84409 4.71701 9.85002C4.71701 10.8559 4.32539 11.8207 3.62832 12.532C2.93125 13.2433 1.98581 13.6429 1 13.6429V16.1715C1 16.8421 1.26107 17.4852 1.72579 17.9594C2.19051 18.4336 2.8208 18.7 3.478 18.7H23.302C23.9592 18.7 24.5895 18.4336 25.0543 17.9594C25.519 17.4852 25.78 16.8421 25.78 16.1715V13.6429C24.7942 13.6429 23.8488 13.2433 23.1517 12.532C22.4547 11.8207 22.063 10.8559 22.063 9.85002C22.063 8.84409 22.4547 7.87936 23.1517 7.16806C23.8488 6.45676 24.7942 6.05715 25.78 6.05715V3.52858C25.78 2.85796 25.519 2.2148 25.0543 1.7406C24.5895 1.2664 23.9592 1 23.302 1H3.478C2.8208 1 2.19051 1.2664 1.72579 1.7406C1.26107 2.2148 1 2.85796 1 3.52858V6.05715Z"
            stroke="#CC2B1E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const TieringNudge = props => {
    const { tieringNudge } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const message = tieringNudge && tieringNudge.message;

    if (!message) {
        return null;
    }

    return (
        <div className={classes.tieringNudge}>
            <span className={classes.tieringNudgeIcon}>
                <TicketIcon />
            </span>
            <span className={classes.tieringNudgeMessage}>{message}</span>
        </div>
    );
};

TieringNudge.propTypes = {
    classes: PropTypes.shape({
        tieringNudge: PropTypes.string,
        tieringNudgeIcon: PropTypes.string,
        tieringNudgeMessage: PropTypes.string
    }),
    tieringNudge: PropTypes.shape({
        message: PropTypes.string
    })
};

export default TieringNudge;
