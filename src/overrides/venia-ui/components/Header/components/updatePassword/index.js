import React, { useState, useRef, useCallback } from 'react';
import { Form } from 'informed';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import Password from '@magento/venia-ui/lib/components/Password';
import defaultClasses from './index.module.css';
import { useToast } from '@/modules/custom-modules/components/Common/Toast';
import DEFAULT_OPERATIONS from '../../../../../../modules/peregrine/talons/NewPassword/newPassword.gql';
import { useMutation } from '@apollo/client';
import { Loader } from 'react-feather';
import {
    hasLengthAtLeast,
    isRequired,
    validatePassword,
} from '@magento/venia-ui/lib/util/formValidators';
import combine from '@magento/venia-ui/lib/util/combineValidators';

const UpdatePassword = ({ classes: classesProp = {}, onSave }) => {
    const { mutations } = DEFAULT_OPERATIONS;
    const [changePasswordApi] = useMutation(mutations.changePasswordMutation, {
        fetchPolicy: 'no-cache'
    })
    const classes = useStyle(defaultClasses, classesProp);
    const { formatMessage } = useIntl();
    const formApiRef = useRef(null);
    const setFormApi = useCallback(api => (formApiRef.current = api), []);
    const { showInfo, showSuccess } = useToast();

    const [loading, setLoading] = useState(false);

    const handleSubmit = async ({ currentPassword, newPassword }) => {
        setLoading(true);
        try {
            const res = await changePasswordApi({
                variables: { currentPassword, newPassword }
            })

            showSuccess('Password changed successfully.');

            try {
                const api = formApiRef.current;
                if (api && typeof api.reset === 'function') {
                    api.reset();
                }
            } catch (e) {
                // ignore reset 错误
            }

        } catch (e) {
            showInfo(e?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={classes.pointWrap}>
            <div className={classes.title}>Change Password</div>
            <div className={classes.formContainer} style={{ position: 'relative' }}>
                <Form
                    getApi={setFormApi}
                    className={classes.form}
                    onSubmit={handleSubmit}
                >
                    <Password
                        isRequired={true}
                        fieldName="currentPassword"
                        label={formatMessage({
                            id: 'signIn.currentPassword',
                            defaultMessage: 'Current Password'
                        })}
                        style={{ color: '#373737' }}
                        validate={combine([
                            isRequired,
                            validatePassword,
                            [hasLengthAtLeast, 8]
                        ])}
                        validateOnBlur
                        placeholder={formatMessage({
                            id: 'signIn.currentPasswordPlaceholder',
                            defaultMessage: 'Enter your Current Password'
                        })}
                        autoComplete="current-password"
                        isToggleButtonHidden={false}
                    />

                    <Password
                        isRequired={true}
                        fieldName="newPassword"
                        label={formatMessage({
                            id: 'signIn.newPassword',
                            defaultMessage: 'New Password'
                        })}
                        style={{ color: '#373737' }}
                        validate={combine([
                            isRequired,
                            validatePassword,
                            [hasLengthAtLeast, 8]
                        ])}
                        validateOnBlur
                        placeholder={formatMessage({
                            id: 'signIn.newPasswordPlaceholder',
                            defaultMessage: 'Enter your New Password'
                        })}
                        autoComplete="current-password"
                        isToggleButtonHidden={false}
                    />

                    <div className={classes.buttonsContainer}>
                        <div className={classes.buttonWrapper}>
                            <Button
                                priority="high"
                                type="submit"
                                disabled={loading}
                                className={classes.buttonsSignIn}
                            >
                                {loading && <Loader size={14} color="#fff" />}
                                <FormattedMessage
                                    id="emailSignIn.signInText"
                                    defaultMessage="Save"
                                />
                            </Button>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
};

UpdatePassword.propTypes = {
    classes: PropTypes.object,
    onSave: PropTypes.func // async ({ currentPassword, newPassword }) => {}
};

export default UpdatePassword;
