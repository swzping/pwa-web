import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useRef
} from 'react';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { useMutation, useQuery } from '@apollo/client';
import { useToasts } from '@magento/peregrine';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/CheckoutPage/ShippingInformation/shippingInformation.gql';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { useAppContext } from '@magento/peregrine/lib/context/app';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { MOCKED_ADDRESS } from '@magento/peregrine/lib/talons/CartPage/PriceAdjustments/ShippingMethods/useShippingForm';
import SIGN_DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/SignIn/signIn.gql';

import Icon from '@magento/venia-ui/lib/components/Icon';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

export const useShippingInformation = props => {
    const { onSave, toggleActiveContent } = props;

    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);

    const [, { addToast }] = useToasts();

    const [, { toggleDrawer }] = useAppContext();
    const [{ cartId }] = useCartContext();
    const [{ isSignedIn }] = useUserContext();

    const [hasUpdate, setHasUpdate] = useState(false);
    const hasLoadedData = useRef(false);

    const {
        setDefaultAddressOnCartMutation,
        getDefaultShippingQuery,
        getShippingInformationQuery
    } = operations;

    const {
        data: shippingInformationData,
        loading: getShippingInformationLoading
    } = useQuery(getShippingInformationQuery, {
        skip: !cartId,
        variables: {
            cartId
        }
    });

    const {
        data: defaultShippingData,
        loading: getDefaultShippingLoading
    } = useQuery(getDefaultShippingQuery, { skip: !isSignedIn });

    const { data: magentoCustomerDataInfo, loading: getMagentoCustomerDataInfoLoading } = useQuery(
        SIGN_DEFAULT_OPERATIONS.getCustomerInformation, { skip: !isSignedIn }
    );

    const [
        setDefaultAddressOnCart,
        { loading: setDefaultAddressLoading }
    ] = useMutation(setDefaultAddressOnCartMutation);

    const isLoading =
        getShippingInformationLoading ||
        getDefaultShippingLoading ||
        setDefaultAddressLoading;

    const shippingData = useMemo(() => {
        let filteredData;
        if (shippingInformationData) {
            const { cart } = shippingInformationData;
            const { customer: magentoCustomer } = magentoCustomerDataInfo || {}

            const { email, shipping_addresses: shippingAddresses } = cart;
            if (shippingAddresses.length) {
                const primaryAddress = { ...shippingAddresses[0] };
                for (const field in MOCKED_ADDRESS) {
                    if (primaryAddress[field] === MOCKED_ADDRESS[field]) {
                        primaryAddress[field] = '';
                    }

                    if (
                        field === 'street' &&
                        primaryAddress[field][0] === MOCKED_ADDRESS[field][0]
                    ) {
                        primaryAddress[field] = [''];
                    }
                }

                // check if not login, get coordinate from dest_location object
                if (
                    !isSignedIn &&
                    cart.dest_location &&
                    cart.dest_location.dest_latitude &&
                    cart.dest_location.dest_longitude
                ) {
                    primaryAddress['latitude'] =
                        cart.dest_location.dest_latitude;
                    primaryAddress['longitude'] =
                        cart.dest_location.dest_longitude;
                }

                const {
                    region_id,
                    label: region,
                    code: region_code
                } = primaryAddress.region;

                primaryAddress.region = {
                    region_code,
                    region_id,
                    region
                };

                filteredData = {
                    email: magentoCustomer?.customer_email && email ? email : '',
                    ...primaryAddress
                };
            }
        }

        return filteredData;
    }, [shippingInformationData, magentoCustomerDataInfo]);

    // Simple heuristic to check shipping data existed prior to this render.
    // On first submission, when we have data, we should tell the checkout page
    // so that we set the next step correctly.
    const doneEditing = !!shippingData && !!shippingData.city;

    useEffect(() => {
        if (doneEditing) {
            onSave(shippingData);
        }
    }, [doneEditing, onSave]);

    useEffect(() => {
        let updateTimer;
        if (shippingData !== undefined) {
            if (hasLoadedData.current) {
                setHasUpdate(true);
                updateTimer = setTimeout(() => {
                    setHasUpdate(false);
                }, 2000);
            } else {
                hasLoadedData.current = true;
            }
        }

        return () => {
            if (updateTimer) {
                clearTimeout(updateTimer);
            }
        };
    }, [hasLoadedData, shippingData]);

    useEffect(async () => {
        if (
            shippingInformationData &&
            !doneEditing &&
            cartId &&
            defaultShippingData
        ) {
            const { customer } = defaultShippingData;
            const { default_shipping: defaultAddressId } = customer;
            if (defaultAddressId) {
                try {
                    await setDefaultAddressOnCart({
                        variables: {
                            cartId,
                            addressId: parseInt(defaultAddressId)
                        }
                    });
                } catch (error) {
                    const errors = new Map([
                        ['setShippingAddressesOnCart', error]
                    ]);
                    const errorMessage = deriveErrorMessage(
                        errors.values(),
                        'something when wrong'
                    );
                    // let messageError = 'setShippingAddressesOnCart';
                    // if(error && error.message) {
                    //     messageError += ` : ${error.message}`;
                    // }

                    addToast({
                        type: 'error',
                        icon: errorIcon,
                        message: errorMessage,
                        dismissable: true,
                        timeout: 10000
                    });
                }
            }
        }
    }, [
        cartId,
        doneEditing,
        defaultShippingData,
        setDefaultAddressOnCart,
        shippingInformationData
    ]);

    const handleEditShipping = useCallback(() => {
        if (isSignedIn) {
            toggleActiveContent();
        } else {
            toggleDrawer('shippingInformation.edit');
        }
    }, [isSignedIn, toggleActiveContent, toggleDrawer]);

    const handleAddShipping = useCallback(() => {
        toggleDrawer('shippingInformation.add');
    }, [toggleDrawer]);

    return {
        doneEditing,
        handleEditShipping,
        handleAddShipping,
        hasUpdate,
        isLoading,
        isSignedIn,
        shippingData
    };
};
