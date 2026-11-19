import { useCallback, useState, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/CheckoutPage/ShippingInformation/AddressForm/guestForm.gql';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { useCartContext } from '@magento/peregrine/lib/context/cart';

import { GOOGLE_MAPS_DEFAULT_POSITION } from 'src/modules/peregrine/talons/MapDisplay/useMapDisplay';

export const useGuestForm = props => {
    const { afterSubmit, onCancel, onSuccess, shippingData } = props;

    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const { setGuestShippingMutation } = operations;

    const [{ cartId }] = useCartContext();

    const [selectedLocation, setSelectedLocation] = useState({});

    const [setGuestShipping, { error, loading }] = useMutation(
        setGuestShippingMutation,
        {
            onCompleted: () => {
                onSuccess();
            }
        }
    );

    const { country } = shippingData;
    const { code: countryCode } = country;

    let initialValues = {
        ...shippingData,
        country: countryCode
    };

    // Simple heuristic to indicate form was submitted prior to this render
    const isUpdate = !!shippingData.city;

    if(isUpdate) {
        const [city, district, subDistrict] = shippingData.city.split(', ');
        initialValues = {
            ...initialValues,
            city,
            district,
            subdistrict: subDistrict,
        };
    }

    const handleSelectLocation = useCallback(
        (coords) => {
            if(coords && coords.lat && coords.lng) {
                const position = {
                    latitude: coords.lat.toString(),
                    longitude: coords.lng.toString()
                };
                setSelectedLocation(position);
            }
        },
        [setSelectedLocation],
    );

    const handleSubmit = useCallback(
        async formValues => {
            const { country, email, region, ...address } = formValues;

            address.city = `${address.city}, ${address.district}, ${address.subdistrict}`;

            delete address.district;
            delete address.subdistrict;

            delete address.searchbox;

            if(selectedLocation.longitude && selectedLocation.latitude) {
                address.longitude = selectedLocation.longitude;
                address.latitude = selectedLocation.latitude;
            }

            try {
                await setGuestShipping({
                    variables: {
                        cartId,
                        email,
                        address: {
                            ...address,
                            // Cleans up the street array when values are null or undefined
                            street: address.street.filter(e => e),
                            // region_id is used for field select and region is used for field input
                            region: region.region_id || region.region,
                            country_code: country
                        }
                    }
                });
            } catch {
                return;
            }

            if (afterSubmit) {
                afterSubmit();
            }
        },
        [afterSubmit, cartId, selectedLocation, setGuestShipping]
    );

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const errors = useMemo(
        () => new Map([['setGuestShippingMutation', error]]),
        [error]
    );

    const pointedLocation = useMemo(() => {
        const { 
            latitude: formLatitude, 
            longitude: formLongitude,
            street,
            city
        }  = initialValues;
        return { 
            lat: formLatitude || GOOGLE_MAPS_DEFAULT_POSITION.lat, 
            lng: formLongitude || GOOGLE_MAPS_DEFAULT_POSITION.lng,
            isOpen: true,
            info: street && city ? `${street[0]}. ${city}.` : null
        };
    }, [initialValues]);

    return {
        errors,
        handleCancel,
        handleSelectLocation,
        handleSubmit,
        initialValues,
        isSaving: loading,
        isUpdate,
        pointedLocation
    };
};
