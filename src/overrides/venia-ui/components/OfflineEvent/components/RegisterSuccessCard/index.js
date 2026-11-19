import React, { useContext, useEffect, useState } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { ChevronRight } from 'react-feather';
import { EventSuccessIcon } from '@/assets/icons';
import compClasses from './index.module.css';

const RegisterSuccessCard = props => {
    const { title = '', subTitle = '', children } = props;
    const classes = useStyle(compClasses, props.classes);

    return (
        <div className={classes.successCard}>
            <div className={classes.successIcon}>
                <EventSuccessIcon />
            </div>
            <h1 className={classes.successTitle}>{title}</h1>
            <div className={classes.successDesc}>{subTitle}</div>
            {children}
        </div>
    );
};

export default RegisterSuccessCard;
