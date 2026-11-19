import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';
import { useToasts } from '@magento/peregrine';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { useMidtrans } from '../../../peregrine/talons/Midtrans/useMidtrans';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

const HeadMidtrans = () => {
    const { snapClient, errors } = useMidtrans();
    const [, { addToast }] = useToasts();
    const { formatMessage } = useIntl();

    const snapClientError = deriveErrorMessage([
        errors.get('getSnapClientKeyQuery')
    ]);

    useEffect(() => {
        if (snapClientError) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: snapClientError,
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, snapClientError]);

    if (!!snapClient) {
        const snapUrl = {
            dev: 'https://app.sandbox.midtrans.com/snap/snap.js',
            prod: 'https://app.midtrans.com/snap/snap.js'
        };
        const url =
            snapClient.storeConfig.snap_is_production === '0'
                ? snapUrl.dev
                : snapUrl.prod;

        return (
            <Helmet>
                <script
                    type="text/javascript"
                    src={url}
                    data-client-key={snapClient.storeConfig.snap_client_key}
                />
            </Helmet>
        );
    } else {
        return (
            <ErrorView
                message={formatMessage({
                    id: 'midtrans.errorTitle',
                    defaultMessage: 'No Midtrans Client'
                })}
            />
        );
    }
};

export default HeadMidtrans;
