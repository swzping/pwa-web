import React, { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useToasts } from '@magento/peregrine';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';

import Icon from '@magento/venia-ui/lib/components/Icon';
import Button from '@magento/venia-ui/lib/components/Button';
import Price from '@magento/venia-ui/lib/components/Price';

import { useStoreCredit } from '../../../peregrine/talons/StoreCredit/useStroreCredit';
import defaultClasses from './storeCredit.module.css';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

const StoreCredit = props => {
    const classes = useStyle(defaultClasses);
    const talonProps = useStoreCredit({
        setIsCartUpdating: props.setIsCartUpdating
    });

    const {
        applyingStoreCredit,
        storeCreditData,
        data,
        errors,
        handleApplyStoreCredit,
        handleRemoveStoreCredit,
        removingStoreCredit,
        status
    } = talonProps;

    const [, { addToast }] = useToasts();

    const removeStoreCreditError = deriveErrorMessage([
        errors.get('removeStoreCreditMutation')
    ]);

    useEffect(() => {
        if (removeStoreCreditError) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: removeStoreCreditError,
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, removeStoreCreditError]);

    if (!data || !storeCreditData) {
        return null;
    }

    if (errors.get('getStoreCreditQuery')) {
        return (
            <div className={classes.errorContainer}>
                <FormattedMessage
                    id={'storeCredit.errorContainer'}
                    defaultMessage={
                        'Something went wrong. Please refresh and try again.'
                    }
                />
            </div>
        );
    }

    if (!!status || !!storeCreditData.is_use_store_credit) {
        return (
            <div className={classes.storeCredit}>
                <span className={classes.storeCreditText}>
                    <FormattedMessage
                        id={'storeCredit.useStoreCredit'}
                        defaultMessage={'Use Store Credit'}
                    />
                    &nbsp;(
                        <Price
                            value={storeCreditData.store_credit_amount}
                            currencyCode={'IDR'}
                        />
                    )
                </span>
                <Button
                    disabled={removingStoreCredit}
                    onClick={handleRemoveStoreCredit}
                    priority={'normal'}
                    type={'button'}
                >
                    <FormattedMessage
                        id={'storeCredit.remove'}
                        defaultMessage={'Remove'}
                    />
                </Button>
            </div>
        );
    } else {
        const errorMessage = deriveErrorMessage([
            errors.get('applyStoreCreditMutation')
        ]);

        if (data.customer.store_credit.enabled) {
            return (
                <div className={classes.storeCredit}>
                    <div className={classes.wrapper}>
                        <span>
                            <FormattedMessage
                                id={'storeCredit.storeCredit'}
                                defaultMessage={'Store Credit'}
                            />
                            &nbsp;(
                                <Price
                                    value={
                                        data.customer.store_credit.current_balance
                                            .value || 0
                                    }
                                    currencyCode={
                                        data.customer.store_credit.current_balance
                                            .currency
                                    }
                                />
                            )
                        </span>
                        <span className={classes.errorTitle}>
                            {errorMessage}
                        </span>
                    </div>
                    <Button
                        disabled={applyingStoreCredit}
                        onClick={handleApplyStoreCredit}
                        priority={'high'}
                        type={'button'}
                    >
                        <FormattedMessage
                            id={'storeCredit.apply'}
                            defaultMessage={'Apply'}
                        />
                    </Button>
                </div>
            );
        } else {
            return null;
        }
    }
};

export default StoreCredit;
