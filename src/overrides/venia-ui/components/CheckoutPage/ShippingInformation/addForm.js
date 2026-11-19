import React from 'react';
import { FormattedMessage } from 'react-intl';
import { X as CloseIcon } from 'react-feather';
import { useAddModal } from '../../../../peregrine/talons/CheckoutPage/ShippingInformation/useAddModal';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { Portal } from '@magento/venia-ui/lib/components/Portal';
import AddressForm from '@magento/venia-ui/lib/components/CheckoutPage/ShippingInformation/AddressForm';
import defaultClasses from './addModal.module.css';

const AddModal = props => {
    const { classes: propClasses, shippingData, onSuccess } = props;
    const talonProps = useAddModal();
    const { handleClose, isOpen } = talonProps;

    const classes = useStyle(defaultClasses, propClasses);
    const rootClass = isOpen ? classes.root_open : classes.root;

    // Unmount the form to force a reset back to original values on close
    const bodyElement = isOpen ? (
        <AddressForm
            onSuccess={onSuccess}
            afterSubmit={handleClose}
            onCancel={handleClose}
            shippingData={shippingData}
        />
    ) : null;

    return (
        <Portal>
            <aside className={rootClass}>
                <div className={classes.header}>
                    <span className={classes.headerText}>
                        <FormattedMessage
                            id={'checkoutPage.addShippingInfo'}
                            defaultMessage={'Add Shipping Information'}
                        />
                    </span>
                    <button
                        className={classes.closeButton}
                        onClick={handleClose}
                    >
                        <Icon src={CloseIcon} />
                    </button>
                </div>
                <div className={classes.body}>{bodyElement}</div>
            </aside>
        </Portal>
    );
};

export default AddModal;
