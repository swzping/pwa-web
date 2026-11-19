import React, { useMemo, useEffect, useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { PlusSquare } from 'react-feather';

import { useAddressBookPage } from '@magento/peregrine/lib/talons/AddressBookPage/useAddressBookPage';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import Icon from '@magento/venia-ui/lib/components/Icon';
import LinkButton from '@magento/venia-ui/lib/components/LinkButton';
import Button from '@magento/venia-ui/lib/components/Button';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';

import AddressCard from './addressCard';
import defaultClasses from './addressBookPage.module.css';

import AddEditDialog from './addEditDialog';
import { HeaderContext } from '../../../peregrine/context/header';

const AddressBookPage = props => {
    const talonProps = useAddressBookPage();
    const {
        confirmDeleteAddressId,
        countryDisplayNameMap,
        customerAddresses,
        formErrors,
        formProps,
        handleAddAddress,
        handleCancelDeleteAddress,
        handleCancelDialog,
        handleConfirmDeleteAddress,
        handleConfirmDialog,
        handleDeleteAddress,
        handleEditAddress,
        handleSelectLocation,
        isDeletingCustomerAddress,
        isDialogBusy,
        isDialogEditMode,
        isDialogOpen,
        isLoading
    } = talonProps;

    const { setNavConfig } = useContext(HeaderContext);
    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses, props.classes);

    const PAGE_TITLE = formatMessage({
        id: 'addressBookPage.addressBookText',
        defaultMessage: 'Address Book'
    });

    useEffect(() => {
        setNavConfig({
            headerTitle: 'Address Book',
            showMobileNav: true,
            useCart: false,
        });
    }, []);

    const addressBookElements = useMemo(() => {
        const defaultToBeginning = (address1, address2) => {
            if (address1.default_shipping) return -1;
            if (address2.default_shipping) return 1;
            return 0;
        };

        return Array.from(customerAddresses)
            .sort(defaultToBeginning)
            .map(addressEntry => {
                const countryName = countryDisplayNameMap.get(
                    addressEntry.country_code
                );

                const boundEdit = () => handleEditAddress(addressEntry);
                const boundDelete = () => handleDeleteAddress(addressEntry.id);
                const isConfirmingDelete =
                    confirmDeleteAddressId === addressEntry.id;

                return (
                    <AddressCard
                        address={addressEntry}
                        countryName={countryName}
                        isConfirmingDelete={isConfirmingDelete}
                        isDeletingCustomerAddress={isDeletingCustomerAddress}
                        key={addressEntry.id}
                        onCancelDelete={handleCancelDeleteAddress}
                        onConfirmDelete={handleConfirmDeleteAddress}
                        onDelete={boundDelete}
                        onEdit={boundEdit}
                    />
                );
            });
    }, [
        confirmDeleteAddressId,
        countryDisplayNameMap,
        customerAddresses,
        handleCancelDeleteAddress,
        handleConfirmDeleteAddress,
        handleDeleteAddress,
        handleEditAddress,
        isDeletingCustomerAddress
    ]);

    const loadingContent = (
        <div className={classes.loadingContentWrapper}>
            <Shimmer key="test-name" width="60%" height='10px' />
            <Shimmer key="test-name" width="80%" height='10px' />
            <Shimmer key="test-name" width="30%" height='10px' />
            <Shimmer key="test-name" width="80%" height='10px' />
            <Shimmer key="test-name" width="30%" height='10px' />
            <Shimmer key="test-name" width="50%" height='10px' />
            <div className={classes.loadingAction}>
                <Shimmer key="test-name" width="30%" height='10px' />
                <Shimmer key="test-name" width="30%" height='10px' />
            </div>
        </div>
    )

    const loadingComponent = (
        <div className={classes.root}>
            <div className={classes.content}>
                {loadingContent}
                {loadingContent}
                {loadingContent}
            </div>
        </div>
    );

    if (isLoading) {
        return loadingComponent;
    }

    return (
        <div className={classes.root}>
            <StoreTitle>{PAGE_TITLE}</StoreTitle>
            <div className={classes.content}>
                {addressBookElements}
            </div>
            <Button
                type="button"
                priority="low"
                onClick={handleAddAddress}
                key="addAddressButton"
                className={classes.addButton}
            >
                <FormattedMessage
                    id="addressBookPage.editAddress2"
                    defaultMessage="Add Address"
                />
            </Button>
            <AddEditDialog
                formErrors={formErrors}
                formProps={formProps}
                isBusy={isDialogBusy}
                isEditMode={isDialogEditMode}
                isOpen={isDialogOpen}
                onCancel={handleCancelDialog}
                onConfirm={handleConfirmDialog}
                onSelectLocation={handleSelectLocation}
            />
        </div>
    );
};

export default AddressBookPage;
