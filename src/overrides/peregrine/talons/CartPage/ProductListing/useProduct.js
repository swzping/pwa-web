import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useMutation, useQuery } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import configuredVariant from '@magento/peregrine/lib/util/configuredVariant';
import { useToasts } from '@magento/peregrine';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/CartPage/ProductListing/product.gql';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { removeToCartTracking } from '../../../../../lib/ThirdPartyTracking';

/**
 * This talon contains logic for a product component used in a product listing component.
 * It performs effects and returns prop data for that component.
 *
 * This talon performs the following effects:
 *
 * - Manage the updating state of the cart while a product is being updated or removed
 *
 * @function
 *
 * @param {Object} props
 * @param {ProductItem} props.item Product item data
 * @param {ProductMutations} props.operations GraphQL mutations for a product in a cart
 * @param {function} props.setActiveEditItem Function for setting the actively editing item
 * @param {function} props.setIsCartUpdating Function for setting the updating state of the cart
 *
 * @return {ProductTalonProps}
 *
 * @example <caption>Importing into your project</caption>
 * import { useProduct } from '@magento/peregrine/lib/talons/CartPage/ProductListing/useProduct';
 */

export const useProduct = props => {
    const {
        item,
        setActiveEditItem,
        setIsCartUpdating,
        wishlistConfig,
        refetchCartPage,
        onCartQuantityChanged,
        onRequestRemove
    } = props;

    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const {
        removeItemMutation,
        updateItemQuantityMutation,
        getStoreConfigQuery
    } = operations;

    const { formatMessage } = useIntl();

    const [, { addToast }] = useToasts();

    const { data: storeConfigData } = useQuery(getStoreConfigQuery, {
        fetchPolicy: 'cache-and-network'
    });

    const configurableThumbnailSource = useMemo(() => {
        if (storeConfigData) {
            return storeConfigData.storeConfig.configurable_thumbnail_source;
        }
    }, [storeConfigData]);

    const storeUrlSuffix = useMemo(() => {
        if (storeConfigData) {
            return storeConfigData.storeConfig.product_url_suffix;
        }
    }, [storeConfigData]);

    const flatProduct = flattenProduct(
        item,
        configurableThumbnailSource,
        storeUrlSuffix
    );

    const [
        removeItemFromCart,
        {
            called: removeItemCalled,
            error: removeItemError,
            loading: removeItemLoading
        }
    ] = useMutation(removeItemMutation);

    const [
        updateItemQuantity,
        {
            loading: updateItemLoading,
            error: updateError,
            called: updateItemCalled
        }
    ] = useMutation(updateItemQuantityMutation);

    const [
        { cartId },
        {
            actions: { updateCartObsolete }
        }
    ] = useCartContext();

    // Use local state to determine whether to display errors or not.
    // Could be replaced by a "reset mutation" function from apollo client.
    // https://github.com/apollographql/apollo-feature-requests/issues/170
    const [displayError, setDisplayError] = useState(false);

    // Used to force Quantity component re-mount with original value on error
    const [quantityResetKey, setQuantityResetKey] = useState(0);

    const isProductUpdating = useMemo(() => {
        if (updateItemCalled || removeItemCalled) {
            return removeItemLoading || updateItemLoading;
        } else {
            return false;
        }
    }, [
        updateItemCalled,
        removeItemCalled,
        removeItemLoading,
        updateItemLoading
    ]);

    const derivedErrorMessage = useMemo(() => {
        return (
            (displayError &&
                deriveErrorMessage([updateError, removeItemError])) ||
            ''
        );
    }, [displayError, removeItemError, updateError]);

    const handleEditItem = useCallback(() => {
        setActiveEditItem(item);

        // If there were errors from removing/updating the product, hide them
        // when we open the modal.
        setDisplayError(false);
    }, [item, setActiveEditItem]);

    const [displayRemoveLoaderId, setDisplayRemoveLoaderId] = useState(null)
    const handleRemoveFromCart = useCallback(async () => {
        const itemPrices = {
            price: {
                value: item.custom_price.row_total.value,
                currency: item.custom_price.row_total.currency,
            }
        };
        try {
            setDisplayRemoveLoaderId(item.id);
            await removeItemFromCart({
                variables: {
                    cartId,
                    itemId: item.id
                }
            }).then(() => {
                updateCartObsolete(true);
                setDisplayRemoveLoaderId(null);
                refetchCartPage();
                removeToCartTracking(item.id, item.product, itemPrices, item.quantity);
            });
        } catch (err) {
            // Make sure any errors from the mutation are displayed.
            // setDisplayError(true);
            const message = err.message || deriveErrorMessage(err);
            addToast({
                type: 'error',
                message: message,
                timeout: 3000
            });
            setDisplayRemoveLoaderId(null);
        }
    }, [cartId, item.id, removeItemFromCart, addToast]);

    const [displaySubtotalLoaderId, setDisplaySubtotalLoaderId] = useState(null);
    const handleUpdateItemQuantity = useCallback(
        async quantity => {
            if (quantity === 0) {
                setQuantityResetKey(prev => prev + 1);
                onRequestRemove?.();
                return;
            }

            try {
                updateCartObsolete(false);
                setDisplaySubtotalLoaderId(item.id);
                await updateItemQuantity({
                    variables: {
                        cartId,
                        itemId: item.id,
                        quantity
                    }


                }).then((res) => {
                    updateCartObsolete(true);
                    setDisplaySubtotalLoaderId(null);

                    if (res?.data?.updateCartItems?.user_errors?.length) {
                        const message = res.data.updateCartItems.user_errors[0]?.message || '';
                        addToast({
                            type: 'error',
                            message: message,
                            timeout: 3000
                        });
                        setQuantityResetKey(prev => prev + 1);
                        return;
                    }

                    if (Number(quantity) !== Number(item.quantity)) {
                        onCartQuantityChanged?.({ cartId });
                    }
                });
            } catch (err) {
                // Make sure any errors from the mutation are displayed.
                // setDisplayError(true);
                const message = err.message || deriveErrorMessage(err);
                addToast({
                    type: 'error',
                    message: message,
                    timeout: 3000
                });

                setDisplaySubtotalLoaderId(null);

                // Restore quantity to original value on error
                setQuantityResetKey(prev => prev + 1);
            }
        },
        [cartId, item.id, item.quantity, onCartQuantityChanged, onRequestRemove, updateItemQuantity, updateCartObsolete, addToast]
    );

    useEffect(() => {
        setIsCartUpdating(isProductUpdating);

        // Reset updating state on unmount
        return () => setIsCartUpdating(false);
    }, [setIsCartUpdating, isProductUpdating]);

    const addToWishlistProps = {
        // afterAdd: handleRemoveFromCart,
        buttonText: () =>
            formatMessage({
                id: 'product.saveForLater',
                defaultMessage: 'Save for later'
            }),
        item: {
            categories: item.product.categories,
            name: item.product.name,
            price: {
                regularPrice: {
                    amount: { ...item.custom_price.row_total },
                }
            },
            selected_options: item.configurable_options
                ? item.configurable_options.map(
                    option => option.configurable_product_option_value_uid
                )
                : [],
            sku: item.product.sku,
            quantity: item.quantity,
        },
        quantity: item.quantity,
        storeConfig: wishlistConfig
    };

    return {
        addToWishlistProps,
        errorMessage: derivedErrorMessage,
        handleEditItem,
        handleRemoveFromCart,
        handleUpdateItemQuantity,
        isEditable: !!flatProduct.options.length,
        product: flatProduct,
        isProductUpdating,
        displaySubtotalLoaderId,
        displayRemoveLoaderId,
        quantityResetKey
    };
};

const flattenProduct = (item, configurableThumbnailSource, storeUrlSuffix) => {
    const {
        configurable_options: options = [],
        custom_price,
        product,
        quantity,
        custom_cart_discount: customCartDiscount,
        is_free_gift,
        is_gamification_free_gift
    } = item;

    const configured_variant =
        item.configured_variant || configuredVariant(options, product);

    const { row_total } = custom_price;
    const { value: unitPrice, currency } = row_total;

    const {
        name,
        small_image,
        stock_status: parentStockStatus,
        stock_item: parentStockItem,
        url_key: urlKey,
        promo
    } = product;
    const stockStatus = configured_variant?.stock_status || parentStockStatus;
    const stockItem = configured_variant?.stock_item || parentStockItem;
    const { url: image } =
        !is_free_gift &&
        !is_gamification_free_gift &&
        configurableThumbnailSource === 'itself' &&
        configured_variant
            ? configured_variant.small_image
            : small_image;

    return {
        currency,
        image,
        name,
        options,
        quantity,
        stockStatus,
        stockItem,
        unitPrice,
        urlKey,
        urlSuffix: storeUrlSuffix,
        customCartDiscount,
        promo,
        is_free_gift,
        is_gamification_free_gift
    };
};

/** JSDocs type definitions */

/**
 * GraphQL mutations for a product in a cart.
 * This is a type used by the {@link useProduct} talon.
 *
 * @typedef {Object} ProductMutations
 *
 * @property {GraphQLDocument} removeItemMutation Mutation for removing an item in a cart
 * @property {GraphQLDocument} updateItemQuantityMutation Mutation for updating the item quantity in a cart
 *
 * @see [product.js]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/ProductListing/product.js}
 * to see the mutations used in Venia
 */

/**
 * Object type returned by the {@link useProduct} talon.
 * It provides prop data for rendering a product component on a cart page.
 *
 * @typedef {Object} ProductTalonProps
 *
 * @property {String} errorMessage Error message from an operation perfored on a cart product.
 * @property {function} handleEditItem Function to use for handling when a product is modified.
 * @property {function} handleRemoveFromCart Function to use for handling the removal of a cart product.
 * @property {function} handleUpdateItemQuantity Function to use for handling updates to the product quantity in a cart.
 * @property {boolean} isEditable True if a cart product is editable. False otherwise.
 * @property {ProductItem} product Cart product data
 */

/**
 * Data about a product item in the cart.
 * This type is used in the {@link ProductTalonProps} type returned by the {@link useProduct} talon.
 *
 * @typedef {Object} ProductItem
 *
 * @property {String} currency The currency associated with the cart product
 * @property {String} image The url for the cart product image
 * @property {String} name The name of the product
 * @property {Array<Object>} options A list of configurable option objects
 * @property {number} quantity The quantity associated with the cart product
 * @property {number} unitPrice The product's unit price
 * @property {String} urlKey The product's url key
 * @property {String} urlSuffix The product's url suffix
 */
