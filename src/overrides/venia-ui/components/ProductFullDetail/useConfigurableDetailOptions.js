import { useEffect, useMemo, useRef, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useLocation } from 'react-router-dom';

import {
    getConfigurableDisplayDetails,
    getConfigurableOptionGroups,
    getInitialSelectedOptionsFromCartItems,
    getInitialSelectedOptionsFromOptionUids,
    getIsConfigurableSelectionSaleable,
    getIsPdpCartActionDisabled,
    getNextSelectedOptions,
    getOptionValueId,
    getSelectedConfigurableVariant,
    getSelectedOptionUids,
    getSelectedOptionsSignature,
} from './productOptions';

const PDP_CART_QUERY = gql`
    query getPdpConfigurableCartItems($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            items {
                uid
                quantity
                product {
                    uid
                    sku
                }
                ... on ConfigurableCartItem {
                    configurable_options {
                        id
                        value_id
                        configurable_product_option_value_uid
                    }
                }
            }
        }
    }
`;

const isConfigurableProduct = product =>
    product?.__typename === 'ConfigurableProduct' || product?.type_id === 'configurable';

const useConfigurableDetailOptions = ({
    initialSelectedOptionUids = [],
    isAddToCartDisabled,
    mediaGalleryEntries,
    product,
    productDetails
}) => {
    const appliedCartSelectionSignatureRef = useRef('');
    const appliedUrlSelectionSignatureRef = useRef('');
    const hasUserSelectedOptionsRef = useRef(false);
    const [{ cartId, isCartObsolete }] = useCartContext();
    const { search } = useLocation();
    const baseGroups = useMemo(() => getConfigurableOptionGroups(product), [product]);
    const [selectedOptions, setSelectedOptions] = useState(() => {
        const selectedOptionUids = new URLSearchParams(search)
            .get('selected_options')
            ?.split(',')
            .map(decodeURIComponent)
            .filter(Boolean);
        const initialSelectedOptionsFromUrl = getInitialSelectedOptionsFromOptionUids(baseGroups, selectedOptionUids);
        const initialSelectedOptionsFromProps = getInitialSelectedOptionsFromOptionUids(
            baseGroups,
            initialSelectedOptionUids,
        );

        return Object.keys(initialSelectedOptionsFromUrl).length
            ? initialSelectedOptionsFromUrl
            : initialSelectedOptionsFromProps;
    });
    const { data: cartData } = useQuery(PDP_CART_QUERY, {
        fetchPolicy: 'cache-and-network',
        skip: !cartId || !isConfigurableProduct(product),
        variables: {
            cartId,
        },
    });

    const groups = useMemo(() => getConfigurableOptionGroups(product, selectedOptions), [product, selectedOptions]);
    const selectedOptionUids = useMemo(() => getSelectedOptionUids(baseGroups, selectedOptions), [
        baseGroups,
        selectedOptions,
    ]);
    const selectedVariant = getSelectedConfigurableVariant(product, selectedOptionUids);
    const displayDetails = useMemo(
        () =>
            getConfigurableDisplayDetails({
                optionGroups: groups,
                selectedOptions,
                productDetails,
                selectedVariant,
                mediaGalleryEntries,
            }),
        [groups, mediaGalleryEntries, productDetails, selectedOptions, selectedVariant],
    );
    const isSelectionSaleable = getIsConfigurableSelectionSaleable(product, selectedOptionUids);
    const isSelectedVariantOutOfStock =
        !!selectedVariant && !isSelectionSaleable;
    const isCartActionDisabled = getIsPdpCartActionDisabled({
        isBaseDisabled: isAddToCartDisabled,
        isConfigurable: isConfigurableProduct(product),
        isSelectionSaleable,
    });

    const initialSelectedOptionsFromCart = useMemo(() => {
        if (isCartObsolete) {
            return {};
        }

        return getInitialSelectedOptionsFromCartItems(product, cartData?.cart?.items);
    }, [cartData?.cart?.items, isCartObsolete, product]);

    const initialSelectedOptionsFromUrl = useMemo(() => {
        const selectedOptionUids = new URLSearchParams(search)
            .get('selected_options')
            ?.split(',')
            .map(decodeURIComponent)
            .filter(Boolean);

        return getInitialSelectedOptionsFromOptionUids(baseGroups, selectedOptionUids);
    }, [baseGroups, search]);

    const initialSelectedOptionsFromProps = useMemo(() => {
        return getInitialSelectedOptionsFromOptionUids(baseGroups, initialSelectedOptionUids);
    }, [baseGroups, initialSelectedOptionUids]);

    useEffect(() => {
        appliedCartSelectionSignatureRef.current = '';
        appliedUrlSelectionSignatureRef.current = '';
        hasUserSelectedOptionsRef.current = false;
        setSelectedOptions({});
    }, [product?.uid]);

    useEffect(() => {
        const urlSelectionSignature = getSelectedOptionsSignature(initialSelectedOptionsFromUrl);

        if (urlSelectionSignature) {
            if (urlSelectionSignature !== appliedUrlSelectionSignatureRef.current) {
                setSelectedOptions(initialSelectedOptionsFromUrl);
                appliedUrlSelectionSignatureRef.current = urlSelectionSignature;
            }

            return;
        }

        const propSelectionSignature = getSelectedOptionsSignature(initialSelectedOptionsFromProps);

        if (propSelectionSignature) {
            if (propSelectionSignature !== appliedUrlSelectionSignatureRef.current) {
                setSelectedOptions(initialSelectedOptionsFromProps);
                appliedUrlSelectionSignatureRef.current = propSelectionSignature;
            }

            return;
        }

        const cartSelectionSignature = getSelectedOptionsSignature(initialSelectedOptionsFromCart);

        if (hasUserSelectedOptionsRef.current) {
            return;
        }

        if (cartSelectionSignature) {
            if (cartSelectionSignature === appliedCartSelectionSignatureRef.current) {
                return;
            }

            setSelectedOptions(initialSelectedOptionsFromCart);
            appliedCartSelectionSignatureRef.current = cartSelectionSignature;
            return;
        }

        if (appliedCartSelectionSignatureRef.current) {
            setSelectedOptions({});
            appliedCartSelectionSignatureRef.current = '';
        }
    }, [initialSelectedOptionsFromCart, initialSelectedOptionsFromProps, initialSelectedOptionsFromUrl]);

    const handleOptionSelect = (group, value) => {
        if (group.isPlaceholder) {
            return;
        }

        hasUserSelectedOptionsRef.current = true;
        setSelectedOptions(currentOptions => getNextSelectedOptions(currentOptions, group.id, getOptionValueId(value)));
    };

    return {
        displayDetails,
        groups,
        hasOptions: groups.length > 0,
        isCartActionDisabled,
        isSelectedVariantOutOfStock,
        handleOptionSelect,
        selectedOptions,
        selectedOptionUids,
        selectedVariant,
    };
};

export default useConfigurableDetailOptions;
