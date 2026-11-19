import React, { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useToasts } from '@magento/peregrine';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';

import Icon from '@magento/venia-ui/lib/components/Icon';
import Button from '@magento/venia-ui/lib/components/Button';

import { useRewardPoint } from '../../../peregrine/talons/RewardPoint/useRewardPoint';
import defaultClasses from './rewardPoint.module.css';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

const RewardPoint = props => {
    const classes = useStyle(defaultClasses);
    const talonProps = useRewardPoint({
        setIsCartUpdating: props.setIsCartUpdating
    });

    const {
        applyingRewardPoint,
        rewardPointData,
        data,
        errors,
        handleApplyRewardPoint,
        handleRemoveRewardPoint,
        removingRewardPoint,
        status
    } = talonProps;

    const [, { addToast }] = useToasts();

    const removeRewardPointError = deriveErrorMessage([
        errors.get('removeRewardPointMutation')
    ]);

    useEffect(() => {
        if (removeRewardPointError) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: removeRewardPointError,
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, removeRewardPointError]);

    if (!data || !rewardPointData) {
        return null;
    }

    if (errors.get('getRewardPointQuery')) {
        return (
            <div className={classes.errorContainer}>
                <FormattedMessage
                    id={'rewardPoint.errorContainer'}
                    defaultMessage={
                        'Something went wrong. Please refresh and try again.'
                    }
                />
            </div>
        );
    }

    if (!!status || !!rewardPointData.is_use_reward_points) {
        return (
            <div className={classes.rewardPoint}>
                <span className={classes.rewardPointText}>
                    <FormattedMessage
                        id={'rewardPoint.useRewardPoint'}
                        defaultMessage={'Use Reward Point'}
                    />
                    &nbsp;{rewardPointData.reward_points_amount}
                </span>
                <Button
                    disabled={removingRewardPoint}
                    loading={removingRewardPoint}
                    onClick={handleRemoveRewardPoint}
                    priority={'normal'}
                    type={'button'}
                >
                    <FormattedMessage
                        id={'rewardPoint.remove'}
                        defaultMessage={'Remove'}
                    />
                </Button>
            </div>
        );
    } else {
        const errorMessage = deriveErrorMessage([
            errors.get('applyRewardPointMutation')
        ]);

        return (
            <div className={classes.rewardPoint}>
                <div className={classes.wrapper}>
                    <span>
                        <FormattedMessage
                            id={'rewardPoint.myPoints'}
                            defaultMessage={'My Points'}
                        />
                        &nbsp;{data.customerRewardPoints.balance} (
                        {data.customerRewardPoints.formatedBalanceCurrency})
                    </span>
                    <span className={classes.errorTitle}>{errorMessage}</span>
                </div>
                <Button
                    disabled={applyingRewardPoint}
                    loading={applyingRewardPoint}
                    onClick={handleApplyRewardPoint}
                    priority={'high'}
                    type={'button'}
                >
                    <FormattedMessage
                        id={'rewardPoint.apply'}
                        defaultMessage={'Apply'}
                    />
                </Button>
            </div>
        );
    }
};

export default RewardPoint;
