import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './orderListTabs.module.css';
const OrderTabs = ({ tabIndex = 0, tabConfig = [], changeTab }) => {
    const classes = useStyle(defaultClasses);
    return (
        <div className={classes.root}>
            <div className={classes.orderTabs}>
                {tabConfig.map((item, index) => (
                    <div
                        key={index}
                        className={`${classes.tabItem} ${tabIndex === index ? classes.active : ''}`}
                        onClick={() => changeTab?.(index)}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderTabs;
