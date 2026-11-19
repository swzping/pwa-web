import React, { useEffect, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ChevronLeft, X as CloseIcon } from 'react-feather';
import { useStyle } from '@magento/venia-ui/lib/classify';
import compClasses from './index.module.css';

const OfflineHeader = props => {
    const {
        headerTitle = '',
        isShowHeader = true,
        closeIcon = false,
        iconColor = '#000',
        titleStyle = {}
    } = props;
    const classes = useStyle(compClasses);
    const { pathname } = useLocation();
    const history = useHistory();

    const redirectClick = () => {
        history.goBack();
    };

    return (
        <div
            className={`
                ${classes.root} 
                ${isShowHeader ? '' : 'hidden-sm'}`}
        >
            <div className={`${classes.iconWrapper} hidden-sm`}>
                <button onClick={redirectClick}>
                    {closeIcon ? (
                        <CloseIcon color={iconColor} />
                    ) : (
                        <ChevronLeft color={iconColor} />
                    )}
                </button>
            </div>
            {headerTitle ? (
                <p className={classes.title} style={titleStyle}>
                    {headerTitle}
                </p>
            ) : null}
        </div>
    );
};

export default OfflineHeader;
