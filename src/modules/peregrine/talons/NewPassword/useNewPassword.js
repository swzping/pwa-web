import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useToast } from '@/modules/custom-modules/components/Common/Toast';

import DEFAULT_OPERATIONS from './newPassword.gql';

/**
 * Returns props necessary to render a NewPassword form.
 *
 * @function
 *
 * @param {Function} props.onCancel - callback function to call when user clicks the cancel button
 * @param {RequestPasswordEmailMutations} props.mutations - GraphQL mutations for the forgot password form.
 *
 * @returns {NewPasswordProps}
 *
 * @example <caption>Importing into your project</caption>
 * import { useNewPassword } from '@magento/peregrine/lib/talons/NewPassword/useNewPassword.js';
 */
export const useNewPassword = props => {
    const { onCancel, token } = props;
    const { queries, mutations } = DEFAULT_OPERATIONS;
    const { showSuccess, showInfo } = useToast()
    const [hasCompleted, setCompleted] = useState(false);

    const {
        data: resetPasswordTokenData,
        error: resetPasswordTokenError,
        loading: isGettingResetPasswordToken
    } = useQuery(queries.getResetPasswordTokenQuery, {
        variables: { token },
        skip: !token
    });

    const [
        setNewPassword,
        { error: setNewPasswordError, loading: isSubmittingNewPassword }
    ] = useMutation(mutations.setNewPasswordMutation);

    const hasValidToken = useMemo(() => {
        return token && resetPasswordTokenData;
    }, [token, resetPasswordTokenData]);

    const handleFormSubmit = useCallback(
        async (formValues) => {
            const newPasswordInput = {
                ...formValues,
                token,
            }
            try {
                await setNewPassword({ variables: { newPasswordInput } });
                showSuccess('Password successfully updated')
                setCompleted(true);
            } catch (err) {
                showInfo(err.message)
                setCompleted(false);
            }
        },
        [setNewPassword]
    );

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    return {
        formErrors: [setNewPasswordError, resetPasswordTokenError],
        handleCancel,
        handleFormSubmit,
        hasCompleted,
        hasValidToken,
        isGettingResetPasswordToken,
        isSubmittingNewPassword
    };
};

/** JSDocs type definitions */

/**
 * GraphQL mutations for the forgot password form.
 * This is a type used by the {@link useNewPassword} talon.
 *
 * @typedef {Object} RequestPasswordEmailMutations
 *
 * @property {GraphQLAST} requestPasswordResetEmailMutation mutation for requesting password reset email
 *
 * @see [forgotPassword.gql.js]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/NewPassword/forgotPassword.gql.js}
 * for the query used in Venia
 */

/**
 * Object type returned by the {@link useNewPassword} talon.
 * It provides props data to use when rendering the forgot password form component.
 *
 * @typedef {Object} ForgotPasswordProps
 *
 * @property {String} forgotPasswordEmail email address of the user whose password reset has been requested
 * @property {Array} formErrors A list of form errors
 * @property {Function} handleCancel Callback function to handle form cancellations
 * @property {Function} handleFormSubmit Callback function to handle form submission
 * @property {Boolean} hasCompleted True if password reset mutation has completed. False otherwise
 * @property {Boolean} isSubmittingNewPassword True if password reset mutation is in progress. False otherwise
 */
