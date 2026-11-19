import React from 'react';
import { useIntl } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import FormError from '@magento/venia-ui/lib/components/FormError';
import Dialog from '@magento/venia-ui/lib/components/Dialog';
import defaultClasses from '@magento/venia-ui/lib/components/AccountInformationPage/editModal.module.css';
import Form from './form';

const Modal = props => {
    const {
        classes: propClasses,
        formErrors,
        onCancel,
        onSubmit,
        isDisabled,
        isOpen
    } = props;
    const { formatMessage } = useIntl();

    const classes = useStyle(defaultClasses, propClasses);

    return (
        <Dialog
            classes={{ body: classes.bodyEditAccountInformation }}
            confirmText={'Submit Review'}
            isOpen={isOpen}
            onCancel={onCancel}
            onConfirm={onSubmit}
            shouldDisableAllButtons={isDisabled}
            shouldDisableConfirmButton={isDisabled}
            shouldUnmountOnHide={true}
            title={formatMessage({
                id: 'review.modal',
                defaultMessage: 'Write A Review'
            })}
        >
            <FormError
                classes={{ root: classes.errorContainer }}
                errors={formErrors}
            />
            <Form />
        </Dialog>
    );
};

export default Modal;
