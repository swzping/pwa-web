import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useToasts } from '@magento/peregrine';
import { useIntl } from 'react-intl';

export const useAccountInformationPage = props => {
    const {
        mutations: {
            setCustomerInformationMutation,
            changeCustomerPasswordMutation,
            setIsRegisterTestMutation
        },
        queries: { getCustomerInformationQuery }
    } = props;

    const [{ isSignedIn }] = useUserContext();
    const [, { addToast }] = useToasts();
    const { formatMessage } = useIntl();
    const [shouldShowNewPassword, setShouldShowNewPassword] = useState(false);

    const [isUpdateMode, setIsUpdateMode] = useState(false);

    // Use local state to determine whether to display errors or not.
    // Could be replaced by a "reset mutation" function from apollo client.
    // https://github.com/apollographql/apollo-feature-requests/issues/170
    const [displayError, setDisplayError] = useState(false);

    const { data: accountInformationData, error: loadDataError } = useQuery(
        getCustomerInformationQuery,
        {
            skip: !isSignedIn,
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first'
        }
    );

    const [
        setCustomerInformation,
        {
            error: customerInformationUpdateError,
            data: customerInformationUpdateCalled,
            loading: isUpdatingCustomerInformation
        }
    ] = useMutation(setCustomerInformationMutation);

    const [
        changeCustomerPassword,
        {
            error: customerPasswordChangeError,
            data: customerPasswordUpdateCalled,
            loading: isChangingCustomerPassword
        }
    ] = useMutation(changeCustomerPasswordMutation);

    const [
        setIsRegisterTest
    ] = useMutation(setIsRegisterTestMutation);

    const initialValues = useMemo(() => {
        if (accountInformationData) {
            return { customer: accountInformationData.customer };
        }
    }, [accountInformationData]);

    const handleChangePassword = useCallback(() => {
        setShouldShowNewPassword(true);
    }, [setShouldShowNewPassword]);

    const handleCancel = useCallback(() => {
        setIsUpdateMode(false);
        setShouldShowNewPassword(false);
    }, [setIsUpdateMode]);

    const showUpdateMode = useCallback(() => {
        setIsUpdateMode(true);

        // If there were errors from removing/updating info, hide them
        // when we open the modal.
        setDisplayError(false);
    }, [setIsUpdateMode]);

    const handleRegisterMedical = useCallback(() => {
        setIsRegisterTest(true);
    }, [setIsRegisterTest]);

    const handleSubmit = useCallback(
        async ({
            firstname,
            lastname,
            phonenumber,
            whatsapp_number,
            password,
            newPassword
        }) => {
            try {
                firstname = firstname.trim();
                lastname = lastname.trim();
                phonenumber = phonenumber.trim();
                whatsapp_number = whatsapp_number.trim();
                if (password) password = password.trim();
                if (newPassword)
                    newPassword = newPassword
                        ? newPassword.trim()
                        : newPassword;
                if (
                    initialValues.customer.firstname !== firstname ||
                    initialValues.customer.lastname !== lastname ||
                    initialValues.customer.phonenumber !== phonenumber ||
                    initialValues.customer.whatsapp_number !== whatsapp_number
                ) {
                    await setCustomerInformation({
                        variables: {
                            firstname: firstname,
                            lastname: lastname,
                            phonenumber: phonenumber,
                            whatsapp_number: whatsapp_number,
                            // You must send password because it is required
                            // when changing email.
                            password: password
                        }
                    });
                }
                if (password && newPassword) {
                    await changeCustomerPassword({
                        variables: {
                            currentPassword: password,
                            newPassword: newPassword
                        }
                    });
                }
                // After submission, close the form if there were no errors.
                handleCancel(false);
            } catch {
                // Make sure any errors from the mutation are displayed.
                setDisplayError(true);

                // we have an onError link that logs errors, and FormError
                // already renders this error, so just return to avoid
                // triggering the success callback
                return;
            }
        },
        [
            setCustomerInformation,
            handleCancel,
            changeCustomerPassword,
            initialValues
        ]
    );

    const errors = displayError
        ? [customerInformationUpdateError, customerPasswordChangeError]
        : [];

    useEffect(() => {
        if (customerInformationUpdateCalled || customerPasswordUpdateCalled) {
            addToast({
                type: 'info',
                message: formatMessage({
                    id: 'accountInfo.success',
                    defaultMessage: 'Profile has been successfully updated'
                }),
                timeout: 5000
            });
        }
    }, [addToast, customerInformationUpdateCalled, customerPasswordUpdateCalled]);

    return {
        handleCancel,
        formErrors: errors,
        handleSubmit,
        handleChangePassword,
        initialValues,
        isDisabled: isUpdatingCustomerInformation || isChangingCustomerPassword,
        isUpdateMode,
        customerInformationUpdateCalled,
        loadDataError,
        shouldShowNewPassword,
        showUpdateMode,
        handleRegisterMedical
    };
};
