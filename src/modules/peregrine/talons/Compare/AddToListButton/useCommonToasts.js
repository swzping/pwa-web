import React, { useEffect } from 'react';
import { AlertCircle, Check, Info } from 'react-feather';
import { useToasts } from '@magento/peregrine';

import Icon from '@magento/venia-ui/lib/components/Icon';

const CheckIcon = <Icon size={20} src={Check} />;
const ErrorIcon = <Icon size={20} src={AlertCircle} />;
const InfoIcon = <Icon size={20} src={Info} />;

export const useCommonToasts = props => {
    const { errorToastProps, existToastProps, successToastProps } = props;

    const [, { addToast }] = useToasts();

    useEffect(() => {
        if (existToastProps) {
            addToast({ ...existToastProps, icon: InfoIcon });
        }
    }, [addToast, existToastProps]);

    useEffect(() => {
        if (successToastProps) {
            addToast({ ...successToastProps, icon: CheckIcon });
        }
    }, [addToast, successToastProps]);

    useEffect(() => {
        if (errorToastProps) {
            addToast({ ...errorToastProps, icon: ErrorIcon });
        }
    }, [addToast, errorToastProps]);
};
