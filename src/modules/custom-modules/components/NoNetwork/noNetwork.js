import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { NoNetworkSvg } from '@/assets/icons';

import defaultClasses from './noNetwork.module.css';
const NoNetwork = props => {
    const { content } = props || {};
    const classes = useStyle(defaultClasses);
    return (
        <div className={classes.root}>
            <div className={classes.container}>
                <div className={classes.icon}>
                    <NoNetworkSvg style={{ width: '100%', height: '100%' }} />
                </div>
                <div className={classes.title}>{content}</div>
            </div>
        </div>
    );
};

export default NoNetwork;
