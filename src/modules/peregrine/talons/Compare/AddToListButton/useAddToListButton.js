import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useMutation, useQuery } from '@apollo/client';

import { useUserContext } from '@magento/peregrine/lib/context/user';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { getCookies } from '../../../util/cookies';

import rootOperations from '../compare.gql';
import defaultOperations from './addToListButton.gql';

export const useAddToListButton = props => {
    const { afterAdd, beforeAdd, item } = props;

    const { 
        addProductsToCompareListMutation,
        getLocalCompareListProductsQuery,
    } = mergeOperations(defaultOperations, rootOperations);

    const [
        addProductsToCompareList,
        {
            data: addProductData,
            error: errorAddingProduct,
            loading: isAddingToCompareList
        }
    ] = useMutation(addProductsToCompareListMutation);

    const { client: localClient, data: localData } = useQuery(getLocalCompareListProductsQuery);
    const localCompareListProducts = localData && localData.localCompareListProducts 
        ? localData.localCompareListProducts
        : [];

    const isSelected = useMemo(() => {
        return (
            localCompareListProducts.includes(item.sku) || isAddingToCompareList
        );
    }, [localCompareListProducts, isAddingToCompareList, item.sku]);

    const [showExistToast, setShowExistToast] = useState(0);

    const { formatMessage } = useIntl();
    const [{ isSignedIn }] = useUserContext();

    const handleClick = useCallback(async () => {
        if (localCompareListProducts.includes(item.sku)) {
            setShowExistToast(current => ++current);
        }

        const uid = getCookies('uid_compare');
    
        const products = [];
        products.push(item.id.toString());

        try {
            if (beforeAdd) {
                await beforeAdd();
            }

            await addProductsToCompareList({ variables: { uid, products } });

            localClient.writeQuery({
                query: getLocalCompareListProductsQuery,
                data: {
                    localCompareListProducts: [
                        ...localCompareListProducts,
                        item.sku
                    ]
                }
            });

            if (afterAdd) {
                afterAdd();
            }
        } catch (error) {
            console.error(error);
        }
    }, [
        addProductsToCompareList,
        afterAdd,
        beforeAdd,
        localClient,
        localCompareListProducts,
        isSignedIn,
        item,
        getLocalCompareListProductsQuery
    ]);

    const successToastProps = useMemo(() => {
        if (addProductData) {
            return {
                type: 'success',
                message: formatMessage({
                    id: 'compare.galleryButton.successMessageGeneral',
                    defaultMessage:
                        'Item successfully added to your favorites list.'
                }),
                timeout: 5000
            };
        }

        return null;
    }, [addProductData, formatMessage]);

    const existToastProps = useMemo(() => {
        if (showExistToast) {
            return {
                type: 'info',
                message: formatMessage({
                    id: 'wishlist.galleryButton.productExist',
                    defaultMessage:
                        'The product is already exist in the compare list'
                }),
                timeout: 5000
            };
        }

        return null;
    }, [formatMessage, showExistToast]);

    const errorToastProps = useMemo(() => {
        if (errorAddingProduct) {
            return {
                type: 'error',
                message: formatMessage({
                    id: 'compare.galleryButton.addError',
                    defaultMessage:
                        'Something went wrong adding the product to your compare list.'
                }),
                timeout: 5000
            };
        }

        return null;
    }, [errorAddingProduct, formatMessage]);

    const buttonProps = useMemo(
        () => ({
            'aria-label': formatMessage({
                id: 'compareButton.addText',
                defaultMessage: 'Add to Product Compare'
            }),
            isDisabled: isSelected,
            onPress: handleClick,
            type: 'button'
        }),
        [formatMessage, handleClick, isSelected]
    );

    return {
        buttonProps,
        buttonText: props.buttonText && props.buttonText(isSelected),
        localCompareListProducts,
        existToastProps,
        errorToastProps,
        isSelected,
        successToastProps
    };
};
