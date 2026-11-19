import React, { Fragment } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Form, Text } from 'informed';
import { arrayOf, bool, func, number, shape, string } from 'prop-types';
import { useCustomerForm } from '@magento/peregrine/lib/talons/CheckoutPage/ShippingInformation/AddressForm/useCustomerForm';

import { useStyle } from '@magento/venia-ui/lib/classify';
import {
    isRequired,
    withLabel,
    validatePhone
} from '@magento/venia-ui/lib/util/formValidators';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import Button from '@magento/venia-ui/lib/components/Button';
import Checkbox from '@magento/venia-ui/lib/components/Checkbox';
import Country from '@magento/venia-ui/lib/components/Country';
import Field, { Message } from '@magento/venia-ui/lib/components/Field';
import FormError from '@magento/venia-ui/lib/components/FormError';
import Region from '@magento/venia-ui/lib/components/Region';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import defaultClasses from '@magento/venia-ui/lib/components/CheckoutPage/ShippingInformation/AddressForm/customerForm.module.css';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';

import CityGroup from 'src/modules/swift-pwa-ui/components/CityGroup';
import MapDisplay from '../../../../../../modules/swift-pwa-ui/components/MapDisplay';

const CustomerForm = props => {
    const {
        afterSubmit,
        classes: propClasses,
        onCancel,
        onSuccess,
        shippingData
    } = props;

    const talonProps = useCustomerForm({
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
        hasDefaultShipping,
        initialValues,
        isLoading,
        isSaving,
        isUpdate,
        pointedLocation
    } = talonProps;
    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses, propClasses);

    if (isLoading) {
        return (
            <LoadingIndicator>
                <FormattedMessage
                    id={'customerForm.loading'}
                    defaultMessage={'Fetching Customer Details...'}
                />
            </LoadingIndicator>
        );
    }

    const emailRow = !hasDefaultShipping ? (
        <div className={classes.email}>
            <Field
                id="email"
                label={formatMessage({
                    id: 'global.email',
                    defaultMessage: 'Email'
                })}
            >
                <TextInput
                    disabled={true}
                    field="email"
                    id="email"
                    validate={withLabel(isRequired, formatMessage({id: 'global.email',defaultMessage: 'Email'}))}
                />
            </Field>
        </div>
    ) : null;

    const formMessageRow = !hasDefaultShipping ? (
        <div className={classes.formMessage}>
            <Message>
                <FormattedMessage
                    id={'customerForm.formMessage'}
                    defaultMessage={
                        'The shipping address you enter will be saved to your address book and set as your default for future purchases.'
                    }
                />
            </Message>
        </div>
    ) : null;

    // const cancelButton = isUpdate ? (
    //     <Button disabled={isSaving} onClick={handleCancel} priority="low">
    //         <FormattedMessage
    //             id={'global.cancelButton'}
    //             defaultMessage={'Cancel'}
    //         />
    //     </Button>
    // ) : null;

    const cancelButton = (
        <Button disabled={isSaving} onClick={handleCancel} priority="low">
            <FormattedMessage
                id={'global.cancelButton'}
                defaultMessage={'Cancel'}
            />
        </Button>
    );

    const submitButtonText = !hasDefaultShipping
        ? formatMessage({
              id: 'global.saveAndContinueButton',
              defaultMessage: 'Save and Continue'
          })
        : isUpdate
        ? formatMessage({
              id: 'global.updateButton',
              defaultMessage: 'Update'
          })
        : formatMessage({
              id: 'checkoutPage.submitAddressButton',
              defaultMessage: 'Submit'
          });
    const submitButtonProps = {
        disabled: isSaving,
        priority: !hasDefaultShipping ? 'normal' : 'high',
        type: 'submit'
    };

    const defaultShippingElement = hasDefaultShipping ? (
        <div className={classes.defaultShipping}>
            <Checkbox
                disabled={!!initialValues.default_shipping}
                id="default_shipping"
                field="default_shipping"
                label={formatMessage({
                    id: 'customerForm.defaultShipping',
                    defaultMessage: 'Make this my default address'
                })}
            />
        </div>
    ) : (
        <Text type="hidden" field="default_shipping" initialValue={true} />
    );

    return (
        <Fragment>
            <FormError errors={Array.from(errors.values())} />
            <Form
                className={classes.root}
                initialValues={initialValues}
                onSubmit={handleSubmit}
            >
                {formMessageRow}
                {emailRow}
                <div className={classes.firstname}>
                    <Field
                        id="customer_firstname"
                        label={formatMessage({
                            id: 'global.firstName',
                            defaultMessage: 'First Name'
                        })}
                    >
                        <TextInput
                            disabled={!hasDefaultShipping}
                            field="firstname"
                            id="customer_firstname"
                            validate={withLabel(isRequired, formatMessage({id: 'global.firstName',defaultMessage: 'Receiver First Name'}))}
                        />
                    </Field>
                </div>
                <div className={classes.lastname}>
                    <Field
                        id="customer_lastname"
                        label={formatMessage({
                            id: 'global.lastName',
                            defaultMessage: 'Last Name'
                        })}
                    >
                        <TextInput
                            disabled={!hasDefaultShipping}
                            field="lastname"
                            id="customer_lastname"
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
                        id="customer_street0"
                        label={formatMessage({
                            id: 'global.streetAddress',
                            defaultMessage: 'Street Address'
                        })}
                    >
                        <TextInput
                            field="street[0]"
                            validate={withLabel(isRequired, formatMessage({id: 'global.streetAddress',defaultMessage: 'Street Address'}))}
                            id="customer_street0"
                        />
                    </Field>
                </div>
                <div className={classes.street1}>
                    <Field
                        id="customer_street1"
                        label={formatMessage({
                            id: 'global.detailAddress',
                            defaultMessage: 'Detailed Address'
                        })}
                        optional={true}
                    >
                        <TextInput field="street[1]" id="customer_street1" />
                    </Field>
                </div>
                <div className={classes.postcode}>
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
                        id="customer_telephone"
                        label={formatMessage({
                            id: 'global.phoneNumber',
                            defaultMessage: 'Phone Number'
                        })}
                    >
                        <TextInput
                            field="telephone"
                            validate={combine([withLabel(isRequired, formatMessage({id: 'global.phoneNumber',defaultMessage: 'Phone Number'})), validatePhone])}
                            id="customer_telephone"
                        />
                    </Field>
                </div>
                {defaultShippingElement}
                <div className={classes.buttons}>
                    {cancelButton}
                    <Button {...submitButtonProps}>{submitButtonText}</Button>
                </div>
            </Form>
        </Fragment>
    );
};

export default CustomerForm;

CustomerForm.defaultProps = {
    shippingData: {
        country: {
            code: DEFAULT_COUNTRY_CODE
        },
        region: {
            id: null
        }
    }
};

CustomerForm.propTypes = {
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
        formMessage: string,
        defaultShipping: string
    }),
    onCancel: func,
    shippingData: shape({
        city: string,
        country: shape({
            code: string.isRequired
        }).isRequired,
        default_shipping: bool,
        email: string,
        firstname: string,
        id: number,
        lastname: string,
        postcode: string,
        region: shape({
            id: number
        }).isRequired,
        street: arrayOf(string),
        telephone: string
    })
};
