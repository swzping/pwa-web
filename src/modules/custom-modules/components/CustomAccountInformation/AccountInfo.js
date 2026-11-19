import React, { useEffect } from 'react';
import { Form } from 'informed';
import { useIntl } from 'react-intl';
import Button from '@magento/venia-ui/lib/components/Button';
import FormError from '@magento/venia-ui/lib/components/FormError';
// import { useToasts } from '@magento/peregrine';
import { useStyle } from '@magento/venia-ui/lib/classify';
import EditForm from '../../../../overrides/venia-ui/components/AccountInformationPage/editForm';
import defaultClasses from './accountInfo.module.css';

const AccountInfo = props => {
    const { formatMessage } = useIntl();
    const {
        formErrors,
        onCancel,
        onChangePassword,
        onSubmit,
        initialValues,
        isDisabled,
        isOpen,
        customerInformationUpdateCalled,
        shouldShowNewPassword
    } = props;

    const classes = useStyle(defaultClasses);

    // toast move to useaccoutinformationpage
    // const [, { addToast }] = useToasts();

    // useEffect(() => {
    //     if (customerInformationUpdateCalled) {
    //         addToast({
    //             type: 'info',
    //             message: formatMessage({
    //                 id: 'accountInfo.success',
    //                 defaultMessage: 'Profile has been successfully updated'
    //             }),
    //             timeout: 5000
    //         });
    //     }
    // }, [addToast, customerInformationUpdateCalled]);

    const dialogFormProps = { initialValues };
    return (
        <div className={classes.root}>
            <Form {...dialogFormProps} onSubmit={onSubmit}>
                <FormError
                    // classes={{ root: classes.errorContainer }}
                    errors={formErrors}
                />
                <EditForm
                    handleChangePassword={onChangePassword}
                    shouldShowNewPassword={shouldShowNewPassword}
                    desktopAccount
                    desktopAccountClasses={defaultClasses}
                />
                <Button
                    className={classes.saveButton}
                    disabled={isDisabled}
                    loading={isDisabled}
                    priority="high"
                    type="submit"
                >
                    Simpan
                </Button>
            </Form>
        </div>
    );
};

export default AccountInfo;
