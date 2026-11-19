import React from 'react';
import { bool, func, object, shape, string } from 'prop-types';
import { useIntl } from 'react-intl';

import { useStyle } from '@magento/venia-ui/lib/classify';
import {
    isRequired,
    withLabel,
    validatePhone
} from '@magento/venia-ui/lib/util/formValidators';
import combine from '@magento/venia-ui/lib/util/combineValidators';

import Checkbox from '@magento/venia-ui/lib/components/Checkbox';
import Country from '@magento/venia-ui/lib/components/Country';
import Dialog from '@magento/venia-ui/lib/components/Dialog';
import Field from '@magento/venia-ui/lib/components/Field';
import FormError from '@magento/venia-ui/lib/components/FormError';
import Region from '@magento/venia-ui/lib/components/Region';
import TextInput from '@magento/venia-ui/lib/components/TextInput';

import defaultClasses from './addEditDialog.css';
import { GOOGLE_MAPS_DEFAULT_POSITION } from '../../../../modules/peregrine/talons/MapDisplay/useMapDisplay';
import CityGroup from '../../../../modules/swift-pwa-ui/components/CityGroup/cityGroup';
import MapDisplay from '../../../../modules/swift-pwa-ui/components/MapDisplay';

const AddEditDialog = props => {
    const {
        formErrors,
        formProps,
        isBusy,
        isEditMode,
        isOpen,
        onCancel,
        onConfirm,
        onSelectLocation
    } = props;

    const { formatMessage } = useIntl();

    const classes = useStyle(defaultClasses, props.classes);

    let formatTitleArgs;
    if (isEditMode) {
        formatTitleArgs = {
            id: 'addressBookPage.editDialogTitle',
            defaultMessage: 'Edit Address'
        };
    } else {
        formatTitleArgs = {
            id: 'addressBookPage.addDialogTitle',
            defaultMessage: 'New Address'
        };
    }
    const title = formatMessage(formatTitleArgs);

    const firstNameLabel = formatMessage({
        id: 'global.firstName',
        defaultMessage: 'First Name'
    });
    const middleNameLabel = formatMessage({
        id: 'global.middleName',
        defaultMessage: 'Middle Name'
    });
    const lastNameLabel = formatMessage({
        id: 'global.lastName',
        defaultMessage: 'Last Name'
    });
    const street1Label = formatMessage({
        id: 'global.streetAddress',
        defaultMessage: 'Street Address'
    });
    const street2Label = formatMessage({
        id: 'global.detailAddress',
        defaultMessage: 'Detailed Address'
    });
    const telephoneLabel = formatMessage({
        id: 'global.phoneNumber',
        defaultMessage: 'Phone Number'
    });
    const defaultAddressCheckLabel = formatMessage({
        id: 'addressBookPage.makeDefaultAddress',
        defaultMessage: 'Make this my default address'
    });

    const pointedPosition = React.useMemo(() => {
        const {
            latitude: formLatitude,
            longitude: formLongitude,
            street,
            city
        } = formProps.initialValues;
        return {
            lat: formLatitude || GOOGLE_MAPS_DEFAULT_POSITION.lat,
            lng: formLongitude || GOOGLE_MAPS_DEFAULT_POSITION.lng,
            isOpen: true,
            info: `${street && street[0]}. ${city}.`
        };
    }, [formProps.initialValues]);

    return (
        <Dialog
            confirmTranslationId={'global.save'}
            cancelTranslationId={'global.cancel'}
            confirmText="Save"
            cancelText='Cancel'
            formProps={formProps}
            isOpen={isOpen}
            onCancel={onCancel}
            onConfirm={onConfirm}
            shouldDisableAllButtons={isBusy}
            title={title}
        >
            <FormError
                classes={{ root: classes.errorContainer }}
                errors={Array.from(formErrors.values())}
            />
            <div className={classes.root}>
                <div className={classes.firstname}>
                    <Field id="firstname" label={firstNameLabel}>
                        <TextInput field="firstname" validate={withLabel(isRequired, firstNameLabel)} />
                    </Field>
                </div>
                {/* <div className={classes.middlename}>
                    <Field
                        id="middlename"
                        label={middleNameLabel}
                        optional={true}
                    >
                        <TextInput field="middlename" />
                    </Field>
                </div> */}
                <div className={classes.lastname}>
                    <Field id="lastname" label={lastNameLabel}>
                        <TextInput field="lastname" validate={withLabel(isRequired, lastNameLabel)} />
                    </Field>
                </div>
                <div className={classes.country}>
                    <Country field={'country_code'} validate={withLabel(isRequired, 'Country')} />
                </div>
                <div className={classes.region}>
                    <Region
                        countryCodeField={'country_code'}
                        fieldInput={'region[region]'}
                        fieldSelect={'region[region_id]'}
                        translationId={'province.label'}
                        label={'State / Province'}
                        optionValueKey="id"
                        validate={withLabel(isRequired,'Province')}
                    />
                </div>
                <div className={classes.street1}>
                    <Field id="street1" label={street1Label}>
                        <TextInput field="street[0]" validate={withLabel(isRequired, 'Street Address')} />
                    </Field>
                </div>
                <div className={classes.street2}>
                    <Field id="street2" label={street2Label} optional={true}>
                        <TextInput field="street[1]" />
                    </Field>
                </div>
                <div className={classes.telephone}>
                    <CityGroup {...formProps} />
                </div>
                {/* temporarily hidden */}
                {/* <div className={classes.map}>
                    <MapDisplay
                        enableSearchBox
                        enableConfirmationPinPoint
                        onSelectLocation={onSelectLocation}
                        pointedPosition={pointedPosition}
                    />
                </div> */}
                <div className={classes.telephone}>
                    <Field id="telephone" label={telephoneLabel}>
                        <TextInput
                            field="telephone"
                            validate={combine([withLabel(isRequired, telephoneLabel), validatePhone])}
                        />
                    </Field>
                </div>
                <div className={classes.default_address_check}>
                    <Checkbox
                        field="default_shipping"
                        label={defaultAddressCheckLabel}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default AddEditDialog;

AddEditDialog.propTypes = {
    classes: shape({
        root: string,
        city: string,
        country: string,
        default_address_check: string,
        errorContainer: string,
        firstname: string,
        lastname: string,
        middlename: string,
        postcode: string,
        region: string,
        street1: string,
        street2: string,
        telephone: string
    }),
    formErrors: object,
    isEditMode: bool,
    isOpen: bool,
    onCancel: func,
    onConfirm: func
};
