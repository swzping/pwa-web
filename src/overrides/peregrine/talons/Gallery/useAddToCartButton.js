import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { useCartContext } from '@magento/peregrine/lib/context/cart';
import {
    isInvalidCart,
    recoverCart,
    retrieveCartId
} from '@magento/peregrine/lib/store/actions/cart/asyncActions';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import { useToasts } from '@magento/peregrine';
import operations from './addToCart.gql';
import miniCartOperations from '@magento/venia-ui/lib/components/MiniCart/miniCart.gql';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useMiniCart } from '@magento/peregrine/lib/talons/MiniCart/useMiniCart';
import { addToCartTracking } from '../../../../lib/ThirdPartyTracking';
import { trackProductAddToWCart } from '@/utils/track';
import { findPurchasableCartItemBySku } from './cartItemMatching';
/**
 * @param {Number} props.item.id - id of item
 * @param {String} props.item.name - name of item
 * @param {String} props.item.stock_status - stock status of item
 * @param {String} props.item.type_id - product type
 * @param {String} props.item.url_key - item url key
 * @param {String} props.item.sku - item sku
 *
 * @returns {
 *      handleAddToCart: Function,
 *      isDisabled: Boolean,
 *      isInStock: Boolean
 * }
 *
 */
const UNSUPPORTED_PRODUCT_TYPES = ['grouped'];
const EMPTY_SELECTED_OPTIONS = [];

const shouldUpdateLastSuccessfulQuantity = ({
    selectedOptions = [],
    submittedVariantSku,
    itemSku,
    variantPreselectedOptions = []
}) => {
    if (submittedVariantSku) {
        return submittedVariantSku === itemSku;
    }

    if (!variantPreselectedOptions.length) {
        return !selectedOptions.length;
    }

    if (selectedOptions.length !== variantPreselectedOptions.length) {
        return false;
    }

    const selectedOptionUidSet = new Set(selectedOptions);

    return variantPreselectedOptions.every(optionUid => selectedOptionUidSet.has(optionUid));
};

export const useAddToCartButton = props => {
    // const { item, successAddToCartProps = () => {} } = props;
    const { item, relativePath, selectedOptions: selectedOptionsFromProps } = props;

    const [isLoading, setIsLoading] = useState(false);
    const [lastSuccessfulQuantity, setLastSuccessfulQuantity] = useState(null);
    const [quantityResetTrigger, setQuantityResetTrigger] = useState(0);

    const [, { addToast }] = useToasts();

    const isInStock = item.stock_status === 'IN_STOCK';

    const productType = item.type_id;
    const isConfigurableParentProduct = productType === 'configurable' && !item.variant_parent_sku;
    const isUnsupportedProductType = UNSUPPORTED_PRODUCT_TYPES.includes(
        productType
    );
    const isDisabled = isLoading || !isInStock || isUnsupportedProductType;

    const history = useHistory();
    const dispatch = useDispatch();

    const [{ isSignedIn }] = useUserContext();

    const { productList, loading: miniCartLoading } = useMiniCart({
        isOpen: false,
        setIsOpen: () => { },
        operations: miniCartOperations
    });

    const variantPreselectedOptions = item.variant_preselected_options || EMPTY_SELECTED_OPTIONS;
    const selectedOptionsForCartMatch = Array.isArray(selectedOptionsFromProps)
        ? selectedOptionsFromProps
        : variantPreselectedOptions;
    const selectedOptionsForCartMatchSignature = selectedOptionsForCartMatch.join('|');
    const itemSku = variantPreselectedOptions.length && item.variant_parent_sku ? item.variant_parent_sku : item.sku;

    const product = useMemo(() => {
        if (isConfigurableParentProduct && !selectedOptionsForCartMatch.length) {
            return null;
        }

        return findPurchasableCartItemBySku(productList, itemSku, selectedOptionsForCartMatch);
    }, [isConfigurableParentProduct, itemSku, productList, selectedOptionsForCartMatch]);

    useEffect(() => {
        setLastSuccessfulQuantity(null);
    }, [item.sku, selectedOptionsForCartMatchSignature]);

    // Once the cart has refreshed, its quantity (including a removed item)
    // supersedes the local value. Ignore the temporary empty list while loading.
    useEffect(() => {
        if (!miniCartLoading) {
            setLastSuccessfulQuantity(null);
        }
    }, [miniCartLoading, product?.id, product?.quantity]);

    const [
        { cartId },
        {
            actions: { updateCartObsolete }
        }
    ] = useCartContext();

    // A replaced cartId means the previous cart is gone server-side. Drop
    // the locally remembered quantity so the card re-syncs to the new cart
    // instead of showing a quantity that only existed in the dead one.
    const prevCartIdRef = useRef(cartId);
    useEffect(() => {
        if (prevCartIdRef.current !== cartId) {
            prevCartIdRef.current = cartId;
            setLastSuccessfulQuantity(null);
        }
    }, [cartId]);

    const [addToCart, { data: addToCartData }] = useMutation(
        operations.ADD_ITEM
    );

    const [addDownloadableProductToCart] = useMutation(
        operations.ADD_DOWNLOADABLE_ITEM
    );

    const [addVirtualProductToCart] = useMutation(operations.ADD_VIRTUAL_ITEM);

    const [updateItemQuantity] = useMutation(
        operations.UPDATE_ITEM
    );

    const [getCustomerData, { data: dataCustomer }] = useLazyQuery(operations.getEmailCustomer, {
        fetchPolicy: 'cache-and-network',
        skip: !isSignedIn
    });

    const handleAddToCart = useCallback(
        async (formValues = {}) => {
            const performAdd = async activeCartId => {
                const minSaleQty = Number(item?.stock_item?.min_sale_qty);
                const quantity = formValues.quantity || (minSaleQty > 1 ? minSaleQty : 1);
                const selectedOptions = formValues.selected_options || variantPreselectedOptions;
                let hasAddUserErrors = false;

                if (productType === 'simple') {
                    setIsLoading(true);

                    const res = await addToCart({
                        variables: {
                            cartId: activeCartId,
                            cartItem: {
                                quantity,
                                selected_options: selectedOptions,
                                sku: itemSku
                            }
                        }
                    });

                    if (res?.data?.addProductsToCart?.user_errors?.length) {
                        hasAddUserErrors = true;
                        const message = res.data.addProductsToCart.user_errors[0]?.message || '';
                        addToast({
                            type: 'error',
                            message: message,
                            timeout: 3000
                        });
                    }

                    setIsLoading(false);
                } else if (productType === 'downloadable') {
                    setIsLoading(true);

                    await addDownloadableProductToCart({
                        variables: {
                            cartId: activeCartId,
                            quantity,
                            sku: item.sku
                        }
                    });

                    setIsLoading(false);
                } else if (productType === 'virtual') {
                    setIsLoading(true);

                    await addVirtualProductToCart({
                        variables: {
                            cartId: activeCartId,
                            quantity,
                            sku: item.sku
                        }
                    });

                    setIsLoading(false);
                } else if (productType === 'configurable') {
                    if (!selectedOptions.length) {
                        history.push(`${item.url_key}.html`);
                    } else {
                        setIsLoading(true);

                        const res = await addToCart({
                            variables: {
                                cartId: activeCartId,
                                cartItem: {
                                    quantity,
                                    selected_options: selectedOptions,
                                    sku: itemSku
                                }
                            }
                        });

                        if (res?.data?.addProductsToCart?.user_errors?.length) {
                            hasAddUserErrors = true;
                            const message = res.data.addProductsToCart.user_errors[0]?.message || '';
                            addToast({
                                type: 'error',
                                message: message,
                                timeout: 3000
                            });
                        }

                        setIsLoading(false);
                    }
                } else {
                    console.warn('Unsupported product type unable to handle.');
                }

                // A user_errors response (e.g. requested qty not available)
                // is a failed add: skip tracking and do not remember the
                // attempted quantity as a success. Drop the local value and
                // remount the stepper so it falls back to the cart's real
                // quantity, mirroring the update-quantity error path.
                if (hasAddUserErrors) {
                    setLastSuccessfulQuantity(null);
                    setQuantityResetTrigger(prev => prev + 1);
                } else {
                    if (['simple', 'downloadable', 'configurable'].includes(productType)) {
                        addToCartTracking(item, quantity, relativePath);
                        trackProductAddToWCart(item, quantity, relativePath)
                    }

                    // Only remember the summed quantity when the submitted
                    // variant is the one this card displays; otherwise the
                    // plain quantity is the truth. Runs on the success path
                    // only, so a user_errors failure keeps its reset.
                    if (
                        shouldUpdateLastSuccessfulQuantity({
                            itemSku: item.sku,
                            selectedOptions,
                            submittedVariantSku: formValues.variant_sku,
                            variantPreselectedOptions
                        })
                    ) {
                        setLastSuccessfulQuantity(Number(product?.quantity || 0) + Number(quantity || 0));
                    } else {
                        setLastSuccessfulQuantity(quantity)
                    }
                }
            };

            try {
                await performAdd(cartId);
            } catch (error) {
                console.error(error);

                // The stored cartId can die server-side (expired quote,
                // cron cleanup). The errorLink heal replaces the cart but
                // does not re-run the failed mutation, by design, so
                // recover the cart and retry the add once here to keep the
                // click from being silently lost.
                if (!isInvalidCart(error)) {
                    setIsLoading(false);
                    return;
                }

                try {
                    await dispatch(recoverCart());
                } catch (recoverError) {
                    console.error(recoverError);
                    setIsLoading(false);
                    return;
                }

                const recoveredCartId = await retrieveCartId();

                try {
                    if (recoveredCartId) {
                        await performAdd(recoveredCartId);
                    }
                } catch (retryError) {
                    console.error(retryError);
                }

                setIsLoading(false);
            } finally {
                updateCartObsolete(true);
            }
        },
        [
            addToCart,
            addDownloadableProductToCart,
            addVirtualProductToCart,
            cartId,
            dispatch,
            history,
            addToast,
            itemSku,
            item.url_key,
            relativePath,
            updateCartObsolete,
            product?.quantity,
            productType,
            variantPreselectedOptions
        ]
    );

    const handleUpdateItemQuantity = useCallback(
        async quantity => {
            const previousQuantity = product?.quantity;
            try {
                setIsLoading(true);

                setLastSuccessfulQuantity(quantity);
                const res = await updateItemQuantity({
                    variables: {
                        cartId,
                        itemId: product.id,
                        quantity
                    }
                });
                if (res?.data?.updateCartItems?.user_errors?.length) {
                    const message = res.data.updateCartItems.user_errors[0]?.message || '';
                    addToast({
                        type: 'error',
                        message: message,
                        timeout: 3000
                    });
                }

                setIsLoading(false);
            } catch (error) {
                const message = deriveErrorMessage([error], 'Failed to update quantity');
                addToast({
                    type: 'error',
                    message: message,
                    timeout: 3000
                });
                setLastSuccessfulQuantity(previousQuantity);
                setQuantityResetTrigger(prev => prev + 1);
                setIsLoading(false);
            } finally {
                updateCartObsolete(true);
            }
        },
        [cartId, item, product, updateItemQuantity, addToast, updateCartObsolete]
    );


    // message success or failed at add product to cart
    useEffect(() => {
        if (addToCartData) {
            if (
                addToCartData.addProductsToCart.toastr_message.status === true
            ) {
                addToast({
                    type: 'info',
                    message:
                        addToCartData.addProductsToCart.toastr_message.message,
                    timeout: 3000
                });
            } else if (
                addToCartData.addProductsToCart.toastr_message.status === false
            ) {
                addToast({
                    type: 'error',
                    message:
                        addToCartData.addProductsToCart.toastr_message.message,
                    timeout: 3000
                });
            }
        }
    }, [addToast, addToCartData]);

    useEffect(async () => {
        if (isSignedIn) {
            await getCustomerData();

        }
    }, [isSignedIn]);

    const errorQtyMessage = useMemo(() => {
        if (addToCartData) {
            if (addToCartData.addProductsToCart.user_errors[0]) {
                return addToCartData.addProductsToCart.user_errors[0].message;
            } else {
                return null;
            }
        }
    }, [addToCartData]);

    return {
        handleAddToCart,
        handleUpdateItemQuantity,
        addToCartData,
        cartId,
        product,
        errorQtyMessage,
        isDisabled,
        isInStock,
        dataCustomer,
        lastSuccessfulQuantity,
        quantityResetTrigger
    };
};
