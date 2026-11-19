import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { NoDataIconSvg } from '@/assets/icons';

import defaultClasses from './noDataPage.module.css';
const NoDataPage = ({ title = '', icon = '', customIconStyle = {} }) => {
    const classes = useStyle(defaultClasses);
    const defaultIcon = <NoDataIconSvg style={{ width: '100%', height: '100%' }} />;
    return (
        <div className={title && icon ? classes.root : ""}>
            <div className={classes.container}>
                <div className={classes.icon} style={customIconStyle}>
                    {icon ? icon : defaultIcon}
                </div>
                <div className={classes.title}>{title}</div>
            </div>
        </div>
    );
};

export default NoDataPage;

