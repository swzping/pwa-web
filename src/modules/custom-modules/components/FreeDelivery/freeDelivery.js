import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import Price from '@magento/venia-ui/lib/components/Price';
import { useMiniCart } from '@magento/peregrine/lib/talons/MiniCart/useMiniCart';
import miniCartOperations from '@magento/venia-ui/lib/components/MiniCart/miniCart.gql';
import { usePriceSummary } from '@magento/peregrine/lib/talons/CartPage/PriceSummary/usePriceSummary';
import { TruckDeliveryOutlined, RadioCheckedFilled } from '@/assets/icons';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './freeDelivery.module.css';

const FreeDelivery = props => {
    const { classes: propClasses } = props;
    const classes = useStyle(defaultClasses, propClasses);
    const { formatMessage } = useIntl();

    // 获取免费配送门槛值
    const { free_shipping_threshold: freeThreshold } = useMiniCart({
        isOpen: false,
        setIsOpen: () => { },
        operations: miniCartOperations
    });

    //获取总金额信息
    const { flatData } = usePriceSummary();
    const { subtotalAfterDiscounts } = flatData;
    const currentAmount = subtotalAfterDiscounts?.value || 0;
    const currency = subtotalAfterDiscounts?.currency || 'USD';

    const { remainingAmount, progressPercentage, isFree } = useMemo(() => {
        const threshold = parseFloat(freeThreshold) || 0;
        const remaining = Math.max(threshold - currentAmount, 0);
        const percentage = Math.min((currentAmount / threshold) * 100, 100);
        const free = remaining <= 0;
        return { remainingAmount: remaining, progressPercentage: percentage, isFree: free };
    }, [currentAmount, freeThreshold]);

    const progressBarStyle = useMemo(
        () => ({
            width: `${progressPercentage}%`,
        }),
        [progressPercentage]
    );

    const rootClass = isFree ? classes.freeRoot : classes.root

    const deliveryIcon = isFree ? <RadioCheckedFilled /> : <TruckDeliveryOutlined />;

    const deliveryMessage = formatMessage(
        isFree
            ? { id: 'freeDelivery.unlocked', defaultMessage: 'Great! Enjoy free delivery' }
            : { id: 'freeDelivery.moreToFree', defaultMessage: 'more to get free delivery' }
    );

    if(!subtotalAfterDiscounts) {
        return null
    }

    return (
        <div className={rootClass}>
            <div className={classes.deliveryIcon}>
                {deliveryIcon}
            </div>
            <div className={classes.tips}>
                <div className={classes.text}>
                    {
                        !isFree ? <span className={classes.price}>
                            <Price value={remainingAmount} currencyCode={currency} />
                        </span> : null
                    }

                    {deliveryMessage}
                </div>
                <div className={classes.progressWrapper}>
                    <div className={classes.progressBar} style={progressBarStyle} />
                </div>
            </div>
        </div>
    );
};

FreeDelivery.propTypes = {
    classes: PropTypes.shape({
        root: PropTypes.string,
        deliveryIcon: PropTypes.string,
        tips: PropTypes.string,
        text: PropTypes.string,
        price: PropTypes.string,
        progressWrapper: PropTypes.string,
        progressBar: PropTypes.string
    }),
    totalItems: PropTypes.number.isRequired
};

export default FreeDelivery;
