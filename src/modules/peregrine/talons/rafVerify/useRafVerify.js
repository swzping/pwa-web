import { useMutation } from '@apollo/client';
import { useEffect } from 'react';
import { rafVerifyMutation } from "./rafVerify.gql";
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useCartContext } from '@magento/peregrine/lib/context/cart';

export const useRafVerify = (props) => {
    const { awRafNumber } = props;

    const [{ cartId }] = useCartContext();
    const [{ isSignedIn }] = useUserContext();

    const [
        refVerifyAction, 
        {
            data,
            error,
            loading
        }
    ] = useMutation(rafVerifyMutation, {
        variables: {
            referral_code: awRafNumber,
            cart_id: cartId && cartId
        }
    });

    useEffect(() => {
        if (isSignedIn && cartId && awRafNumber) {
            refVerifyAction();
        }
    }, [isSignedIn, awRafNumber, refVerifyAction, cartId]);
    

    return {
        data,
        error,
        loading
    };
};