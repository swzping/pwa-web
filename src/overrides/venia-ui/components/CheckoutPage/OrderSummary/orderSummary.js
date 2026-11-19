import React from 'react';
import { FormattedMessage } from 'react-intl';
import PriceSummary from '@magento/venia-ui/lib/components/CartPage/PriceSummary';
import { useStyle } from '@magento/venia-ui/lib/classify';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';

import defaultClasses from './orderSummary.module.css';

const OrderSummary = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { loadingRefetchDataCart, setLoadingRefetchDataCart = () => {}, onLoyaltyPointsLoaded } = props;
    return (
        <div className={classes.root}>
            {!props.isUpdating ?
                <>
                    <h1 className={classes.title}>
                        <FormattedMessage
                            id={'checkoutPage.orderSummary'}
                            defaultMessage={'Order Summary'}
                        />
                    </h1>
                    <PriceSummary
                        showItems={true}
                        isUpdating={props.isUpdating}
                        loadingRefetchDataCart={loadingRefetchDataCart}
                        setLoadingRefetchDataCart={setLoadingRefetchDataCart}
                        selectedPoints={props?.selectedPoints}
                        onLoyaltyPointsLoaded={onLoyaltyPointsLoaded}
                    />
                </> : <LoadingIndicator style={{ textALign: 'center' }} />
            }
        </div>
    );
};

export default OrderSummary;
