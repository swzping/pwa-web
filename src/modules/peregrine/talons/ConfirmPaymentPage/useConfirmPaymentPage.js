import { useState, useCallback, useMemo } from 'react';
import * as Yup from 'yup';

import { useMutation, useQuery } from '@apollo/client';
import { useToasts } from '@magento/peregrine';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { formatDate } from '../../util/date';

import DEFAULT_OPERATIONS from './confirmPaymentPage.gql';

export const useConfirmPaymentPage = (props = {}) => {
    const [, { addToast }] = useToasts();

    const [droppedFile, setDroppedFile] = useState({});

    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const { confirmPaymentMutation, getPaymentBankListQuery } = operations;

    const {
        data: dataPaymentBankList,
        error: errorGetPaymentBankList
    } = useQuery(getPaymentBankListQuery);

    const [
        confirmPayment,
        { error: errorConfirmPayment, loading: loadingConfirmPayment }
    ] = useMutation(confirmPaymentMutation);

    const errors = useMemo(
        () =>
            new Map([
                ['confirmPaymentMutation', errorConfirmPayment],
                ['getPaymentBankListQuery', errorGetPaymentBankList]
            ]),
        [errorConfirmPayment, errorGetPaymentBankList]
    );

    const msgFieldRequired = {
        id: 'validation.isRequired',
        defaultMessage: 'Is required.'
    };
    const msgFieldMustNumber = {
        id: 'validation.isNumber',
        defaultMessage: 'Must Number.'
    };
    const msgFieldMustPositifNumber = {
        id: 'validation.isPositifNumber',
        defaultMessage: 'Must Positif Number.'
    };

    const formValidationSchema = Yup.object().shape({
        order_number: Yup.string().required(msgFieldRequired),
        payment: Yup.string().required(msgFieldRequired),
        account_number: Yup.number()
            .typeError(msgFieldMustNumber)
            .positive(msgFieldMustPositifNumber)
            .required(msgFieldRequired),
        account_name: Yup.string().required(msgFieldRequired),
        amount: Yup.number()
            .typeError(msgFieldMustNumber)
            .positive(msgFieldMustPositifNumber)
            .required(msgFieldRequired),
        date: Yup.string().required(msgFieldRequired)
    });

    const handleDroppedFiles = useCallback(files => {
        const [file] = files;
        const { baseCode, file: meta } = file;

        setDroppedFile({
            filename: meta.name,
            image_base64: baseCode
        });
    }, []);

    const handleSubmit = useCallback(
        formValues => {
            if (!droppedFile.filename || !droppedFile.image_base64) {
                addToast({
                    type: 'error',
                    message: 'Receipt image is required',
                    timeout: 5000
                });

                return;
            }

            confirmPayment({
                variables: {
                    ...formValues,
                    ...droppedFile,
                    amount: parseFloat(formValues.amount),
                    date: formatDate(formValues.date, 'yyyy-MM-dd HH:mm:ss')
                }
            });
        },
        [confirmPayment, droppedFile]
    );

    const paymentBankList = useMemo(() => {
        if (dataPaymentBankList && !errorGetPaymentBankList) {
            return dataPaymentBankList.getPaymentBankList.map(paymentBank => ({
                value: `${paymentBank.bankname} - ${paymentBank.banknumber} (${
                    paymentBank.placeholder
                })`,
                label: `${paymentBank.bankname} - ${paymentBank.banknumber} (${
                    paymentBank.placeholder
                })`
            }));
        }

        return [];
    }, [dataPaymentBankList]);

    return {
        formValidationSchema,
        handleDroppedFiles,
        handleSubmit,
        loading: loadingConfirmPayment,
        paymentBankList,
        errors
    };
};
