import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { useToasts } from '@magento/peregrine';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { GET_CUSTOMER_SETTING, UPDATE_CUSTOMER } from './Settings.gql';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

export const useSettings = () => {
    const [customLoading, setCustomLoading] = useState(false);
    const [customer, setCustomer] = useState(false);
    const [, { addToast }] = useToasts();

    const {
        data
    } = useQuery(GET_CUSTOMER_SETTING);

    // const [actUpdateCustomer, { data: dataUpdate, loading: dataLoading, error: errorUpdate }] = useMutation(UPDATE_CUSTOMER);
    const [actUpdateCustomer, ] = useMutation(UPDATE_CUSTOMER);

    useEffect(() => {
        if (data && data.customer) {
            const customerData = data.customer;
            const { is_subscribed } = customerData;
            setCustomer(is_subscribed);
        }
    }, [data]);

    const handleSave = async () => {
        setCustomLoading(true);
        try {
            await actUpdateCustomer({
                variables: {
                    isSubscribed: !customer
                }
            });
            addToast({
                type: 'info',
                message: 'your prefrences have been updated',
                dismissable: true,
                timeout: 10000
            });
            setCustomLoading(false);
        } catch (error) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: 'update failed',
                dismissable: true,
                timeout: 10000
            });
            setCustomLoading(false);
        }
    };

    
    return {
        customer,
        customLoading,
        handleSave,
        setCustomer
    }
}