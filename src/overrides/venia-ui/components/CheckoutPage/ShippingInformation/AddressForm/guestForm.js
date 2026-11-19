import React, { Fragment } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Form } from 'informed';
import { func, shape, string, arrayOf, number } from 'prop-types';
import { useGuestForm } from '@magento/peregrine/lib/talons/CheckoutPage/ShippingInformation/AddressForm/useGuestForm';

import { useStyle } from '@magento/venia-ui/lib/classify';
import {
    isRequired,
    withLabel,
    validatePhone
} from '@magento/venia-ui/lib/util/formValidators';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import Button from '@magento/venia-ui/lib/components/Button';
import Country from '@magento/venia-ui/lib/components/Country';
import Field, { Message } from '@magento/venia-ui/lib/components/Field';
import FormError from '@magento/venia-ui/lib/components/FormError';
import Region from '@magento/venia-ui/lib/components/Region';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import defaultClasses from '@magento/venia-ui/lib/components/CheckoutPage/ShippingInformation/AddressForm/guestForm.module.css';

import CityGroup from 'src/modules/swift-pwa-ui/components/CityGroup';

import MapDisplay from '../../../../../../modules/swift-pwa-ui/components/MapDisplay';

const GuestForm = props => {
    const {
        afterSubmit,
        classes: propClasses,
        onCancel,
        onSuccess,
        shippingData
    } = props;

    const talonProps = useGuestForm({
        afterSubmit,
        onCancel,
        onSuccess,
        shippingData
    });
    const {
        errors,
        handleCancel,
        handleSelectLocation,
        handleSubmit,
        initialValues,
        isSaving,
        isUpdate,
        pointedLocation
    } = talonProps;

    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses, propClasses);

    const guestEmailMessage = !isUpdate ? (
        <Message>
            <FormattedMessage
                id={'guestForm.emailMessage'}
                defaultMessage={
                    'Set a password at the end of guest checkout to create an account in one easy step.'
                }
            />
        </Message>
    ) : null;

    const cancelButton = isUpdate ? (
        <Button disabled={isSaving} onClick={handleCancel} priority="low">
            <FormattedMessage
                id={'global.cancelButton'}
                defaultMessage={'Cancel'}
            />
        </Button>
    ) : null;

    const submitButtonText = isUpdate
        ? formatMessage({
              id: 'global.updateButton',
              defaultMessage: 'Update'
          })
        : formatMessage({
              id: 'guestForm.continueToNextStep',
              defaultMessage: 'Continue to Shipping Method'
          });
    const submitButtonProps = {
        disabled: isSaving,
        priority: isUpdate ? 'high' : 'normal',
        type: 'submit'
    };

    return (
        <Fragment>
            <FormError errors={Array.from(errors.values())} />
            <Form
                className={classes.root}
                initialValues={initialValues}
                onSubmit={handleSubmit}
            >
                <div className={classes.email}>
                    <Field
                        id="email"
                        label={formatMessage({
                            id: 'global.email',
                            defaultMessage: 'Email'
                        })}
                    >
                        <TextInput
                            field="email"
                            id="email"
                            validate={withLabel(isRequired, formatMessage({id: 'global.email',defaultMessage: 'Email'}))}
                        />
                        {guestEmailMessage}
                    </Field>
                </div>
                <div className={classes.firstname}>
                    <Field
                        id="firstname"
                        label={formatMessage({
                            id: 'global.firstName',
                            defaultMessage: 'First Name'
                        })}
                    >
                        <TextInput
                            field="firstname"
                            id="firstname"
                            validate={withLabel(isRequired, formatMessage({id: 'global.firstName',defaultMessage: 'Receiver First Name'}))}
                        />
                    </Field>
                </div>
                <div className={classes.lastname}>
                    <Field
                        id="lastname"
                        label={formatMessage({
                            id: 'global.lastName',
                            defaultMessage: 'Last Name'
                        })}
                    >
                        <TextInput
                            field="lastname"
                            id="lastname"
                            validate={withLabel(isRequired, formatMessage({id: 'global.lastName',defaultMessage: 'Receiver Last Name'}))}
                        />
                    </Field>
                </div>
                <div className={classes.country}>
                    <Country validate={withLabel(isRequired, 'Country')} />
                </div>
                <div className={classes.region}>
                    <Region
                        validate={withLabel(isRequired, 'Province')}
                        fieldInput={'region[region]'}
                        fieldSelect={'region[region_id]'}
                        optionValueKey={'id'}
                    />
                </div>
                <div className={classes.street0}>
                    <Field
                        id="street0"
                        label={formatMessage({
                            id: 'global.streetAddress',
                            defaultMessage: 'Street Address'
                        })}
                    >
                        <TextInput
                            field="street[0]"
                            id="street0"
                            validate={withLabel(isRequired, formatMessage({id: 'global.streetAddress',defaultMessage: 'Street Address'}))}
                        />
                    </Field>
                </div>
                <div className={classes.street1}>
                    <Field
                        id="street1"
                        label={formatMessage({
                            id: 'global.detailAddress',
                            defaultMessage: 'Detailed Address'
                        })}
                        optional={true}
                    >
                        <TextInput field="street[1]" id="street1" />
                    </Field>
                </div>
                <div className={classes.city}>
                    <CityGroup initialValues={initialValues} />
                </div>
                {/* temporarily hidden */}
                {/* <div className="pb-3" style={{ gridColumnEnd: 'span 2' }}>
                    <MapDisplay
                        enableSearchBox
                        enableConfirmationPinPoint
                        onSelectLocation={handleSelectLocation}
                        pointedPosition={pointedLocation}
                    />
                </div> */}
                <div className={classes.telephone}>
                    <Field
                        id="telephone"
                        label={formatMessage({
                            id: 'global.phoneNumber',
                            defaultMessage: 'Phone Number'
                        })}
                    >
                        <TextInput
                            field="telephone"
                            id="telephone"
                            validate={combine([isRequired, validatePhone])}
                        />
                    </Field>
                </div>
                <div className={classes.buttons}>
                    {cancelButton}
                    <Button {...submitButtonProps}>{submitButtonText}</Button>
                </div>
            </Form>
        </Fragment>
    );
};

export default GuestForm;

GuestForm.defaultProps = {
    shippingData: {
        country: {
            code: DEFAULT_COUNTRY_CODE
        },
        region: {
            code: ''
        }
    }
};

GuestForm.propTypes = {
    afterSubmit: func,
    classes: shape({
        root: string,
        field: string,
        email: string,
        firstname: string,
        lastname: string,
        country: string,
        street0: string,
        street1: string,
        city: string,
        region: string,
        postcode: string,
        telephone: string,
        buttons: string,
        submit: string,
        submit_update: string
    }),
    onCancel: func,
    onSuccess: func.isRequired,
    shippingData: shape({
        city: string,
        country: shape({
            code: string.isRequired
        }).isRequired,
        email: string,
        firstname: string,
        lastname: string,
        postcode: string,
        region: shape({
            region_id: number,
            region: string
        }).isRequired,
        street: arrayOf(string),
        telephone: string
    })
};
