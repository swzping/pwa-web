import React, { useMemo, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useToasts } from '@magento/peregrine';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';

import AddToCartModal from '../../../../../modules/swift-pwa-ui/components/Gallery/addToCartModal';
import { ProductListingFragment } from '@magento/peregrine/lib/talons/CartPage/ProductListing/productListingFragments.gql';
import { getVariantOptionText } from './variantOptionText';

const UPDATE_CONFIGURABLE_OPTIONS_MUTATION = gql`
    mutation updateConfigurableOptions(
        $cartId: String!
        $cartItemId: ID!
        $parentSku: String!
        $quantity: Float!
        $variantSku: String!
    ) {
        addConfigurableProductsToCart(
            input: {
                cart_id: $cartId
                cart_items: [{ data: { quantity: $quantity, sku: $variantSku }, parent_sku: $parentSku }]
            }
        ) @connection(key: "addConfigurableProductsToCart") {
            cart {
                id
            }
        }
        removeItemFromCart(input: { cart_id: $cartId, cart_item_uid: $cartItemId })
            @connection(key: "removeItemFromCart") {
            cart {
                id
                ...ProductListingFragment
            }
        }
    }
    ${ProductListingFragment}
`;

const CartPageVariantSelector = ({ classes, item, quantity, refetchCartPage, setIsCartUpdating }) => {
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [
        { cartId },
        {
            actions: { updateCartObsolete },
        },
    ] = useCartContext();
    const [, { addToast }] = useToasts();
    const [updateConfigurableOptions] = useMutation(UPDATE_CONFIGURABLE_OPTIONS_MUTATION);

    const configurableOptions = item.configurable_options || [];
    const selectedOptionUids = useMemo(
        () => configurableOptions.map(option => option.configurable_product_option_value_uid).filter(Boolean),
        [configurableOptions],
    );
    const stockStatus = item?.configured_variant?.stock_status || item?.product?.stock_status || item?.stock_status;
    const variantButtonText = useMemo(() => {
        if (stockStatus === 'OUT_OF_STOCK') {
            return 'Change other variant';
        }

        return getVariantOptionText(configurableOptions) || 'Change variant';
    }, [configurableOptions, stockStatus]);

    const handleVariantConfirm = async value => {
        const variantSku = value?.variant_sku;

        if (!variantSku) {
            return;
        }

        if (variantSku === item?.configured_variant?.sku) {
            return;
        }

        try {
            setIsCartUpdating?.(true);
            updateCartObsolete(false);

            const res = await updateConfigurableOptions({
                variables: {
                    cartId,
                    cartItemId: item.uid,
                    parentSku: item.product.sku,
                    quantity: item.quantity,
                    variantSku,
                },
            });

            const userErrors = res?.data?.removeItemFromCart?.user_errors || [];

            if (userErrors.length) {
                addToast({
                    type: 'error',
                    message: userErrors[0]?.message || '',
                    timeout: 3000,
                });
                return;
            }

            updateCartObsolete(true);
            await refetchCartPage?.();
        } catch (err) {
            addToast({
                type: 'error',
                message: err.message || deriveErrorMessage(err),
                timeout: 3000,
            });
        } finally {
            setIsCartUpdating?.(false);
        }
    };

    if (!configurableOptions.length) {
        return null;
    }

    return (
        <>
            <button
                type="button"
                className={`${classes.variantButton} ${
                    stockStatus === 'OUT_OF_STOCK' ? classes.variantButtonWarning : ''
                }`}
                onClick={() => setIsVariantModalOpen(true)}
            >
                <span className={classes.variantButtonText}>{variantButtonText}</span>
                <span aria-hidden="true" className={classes.variantChevron} />
            </button>
            <AddToCartModal
                confirmLabel="Update"
                formValues={{
                    quantity,
                }}
                hideQuantity
                initialSelectedOptionUids={selectedOptionUids}
                isOpen={isVariantModalOpen}
                onClose={() => setIsVariantModalOpen(false)}
                onConfirm={handleVariantConfirm}
                productData={item.product}
                productKey={`${item.uid || item.id}-variant`}
                showFallbackOptions={false}
            />
        </>
    );
};

export default CartPageVariantSelector;
