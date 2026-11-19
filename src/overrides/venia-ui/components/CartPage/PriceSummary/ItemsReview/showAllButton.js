import React, { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { useStyle } from '@magento/venia-ui/lib/classify';

import defaultClasses from './showAllButton.module.css';

const ShowAllButton = props => {
    const { onClick, totalQuantity, icon } = props;
    const classes = useStyle(defaultClasses, props.classes || {});

    const handleClick = useCallback(() => {
        onClick();
    }, [onClick]);

    return (
        <button className={classes.root} onClick={handleClick}>
            <span className={classes.content}>
                <div className={classes.total_quantity}>
                    <span className={classes.total_quantity_amount}>
                        {totalQuantity}
                    </span>
                    <FormattedMessage
                        id={'checkoutPage.itemsInYourOrder'}
                        defaultMessage={' items in your order'}
                    />
                </div>
                <Icon
                    src={icon}
                    classes={{
                        root: classes.arrowDown
                    }}
                />
            </span>
        </button>
    );
};

export default ShowAllButton;
