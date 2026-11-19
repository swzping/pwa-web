import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { ChevronLeft } from 'react-feather';
import {
    buildFreeGiftOptionsInput,
    buildSwapFreeGiftInput,
    getGiftConfirmButtonLabel,
    getInitialGiftQuantity,
    getGiftMaxQuantity,
    isGiftSelectionComplete,
    isGiftReserved,
    normalizeMaxSelect,
    normalizeGiftOption
} from './giftChangeModalHelpers';
import classes from './GiftChangeModal.module.css';

export const FREE_GIFT_OPTIONS = gql`
    query FreeGiftOptions($input: FreeGiftOptionsInput!) {
        freeGiftOptions(input: $input) {
            quote_item_id
            rule_id
            max_select
            items {
                sku
                product_id
                name
                image_url
                allowed_qty
                reserved_qty
                available_qty
                is_in_stock
            }
        }
    }
`;

export const SWAP_FREE_GIFT = gql`
    mutation SwapFreeGift($input: SwapFreeGiftInput!) {
        swapFreeGift(input: $input) {
            success
            message
        }
    }
`;

const GiftChangeModal = ({
    isOpen,
    onClose,
    itemId,
    currentGiftSku,
    onGiftChanged,
    variant = 'modal'
}) => {
    const [{ cartId }] = useCartContext();
    const [selectedGiftIds, setSelectedGiftIds] = useState([]);
    const [hasUserChangedSelection, setHasUserChangedSelection] = useState(false);
    const [quantitiesByGiftId, setQuantitiesByGiftId] = useState({});
    const freeGiftOptionsInput = useMemo(() => {
        if (!cartId || !itemId) {
            return null;
        }

        return buildFreeGiftOptionsInput({ cartId, itemId });
    }, [cartId, itemId]);

    const {
        data,
        loading,
        error
    } = useQuery(FREE_GIFT_OPTIONS, {
        variables: freeGiftOptionsInput ? { input: freeGiftOptionsInput } : undefined,
        skip: !isOpen || !freeGiftOptionsInput,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        errorPolicy: 'all'
    });

    const [
        swapFreeGift,
        { loading: isSwapping, error: swapError, data: swapData }
    ] = useMutation(SWAP_FREE_GIFT, {
        awaitRefetchQueries: true,
        refetchQueries: ['MiniCartQuery', 'MiniCartQueryItems', 'CartPage']
    });

    const freeGiftOptions = data?.freeGiftOptions;
    const isLoadingOptions = loading;
    const maxSelect = isLoadingOptions
        ? 1
        : normalizeMaxSelect(freeGiftOptions?.max_select);
    const getGiftQuantity = gift => {
        return quantitiesByGiftId[gift.id] || getInitialGiftQuantity(gift);
    };
    const gifts = useMemo(() => {
        return (freeGiftOptions?.items || []).map(normalizeGiftOption);
    }, [freeGiftOptions]);
    const defaultSelectedGifts = useMemo(() => {
        const reservedGifts = gifts.filter(isGiftReserved);

        if (reservedGifts.length) {
            return reservedGifts;
        }

        const currentGift = gifts.find(gift => gift.sku === currentGiftSku);

        return currentGift ? [currentGift] : [];
    }, [currentGiftSku, gifts]);
    const defaultSelectedGiftIds = useMemo(
        () => defaultSelectedGifts.map(gift => gift.id),
        [defaultSelectedGifts]
    );
    const effectiveSelectedGiftIds = hasUserChangedSelection
        ? selectedGiftIds
        : defaultSelectedGiftIds;
    const selectedGifts = isLoadingOptions
        ? []
        : gifts.filter(gift => effectiveSelectedGiftIds.includes(gift.id));
    const selectedGiftQuantity = selectedGifts.reduce((total, gift) => {
        return total + getGiftQuantity(gift);
    }, 0);
    const isSelectionComplete = isGiftSelectionComplete({
        selectedCount: selectedGiftQuantity,
        maxSelect
    });
    const noticeLabel = `You can choose up to ${
        isLoadingOptions ? 0 : maxSelect
    } items`;
    const confirmButtonLabel = isLoadingOptions
        ? 'Loading...'
        : getGiftConfirmButtonLabel({
              selectedCount: selectedGiftQuantity,
              maxSelect,
              isSubmitting: isSwapping
          });

    useEffect(() => {
        setHasUserChangedSelection(false);
        setSelectedGiftIds([]);
        setQuantitiesByGiftId({});
    }, [cartId, isOpen, itemId]);

    useEffect(() => {
        if (!isOpen || isLoadingOptions) {
            return;
        }

        if (hasUserChangedSelection) {
            return;
        }

        setSelectedGiftIds(defaultSelectedGiftIds);
        setQuantitiesByGiftId(
            defaultSelectedGifts.reduce((result, gift) => {
                result[gift.id] = getInitialGiftQuantity(gift);
                return result;
            }, {})
        );
    }, [
        defaultSelectedGiftIds,
        defaultSelectedGifts,
        hasUserChangedSelection,
        isOpen,
        isLoadingOptions
    ]);

    if (!isOpen) {
        return null;
    }

    const isDrawerVariant = variant === 'drawer';

    const handleDecrease = (event, gift) => {
        event.stopPropagation();
        setQuantitiesByGiftId(currentQuantities => {
            const currentQuantity =
                currentQuantities[gift.id] || getInitialGiftQuantity(gift);

            return {
                ...currentQuantities,
                [gift.id]: Math.max(1, currentQuantity - 1)
            };
        });
    };

    const handleIncrease = (event, gift) => {
        event.stopPropagation();

        setQuantitiesByGiftId(currentQuantities => {
            const currentQuantity =
                currentQuantities[gift.id] || getInitialGiftQuantity(gift);
            const selectedQuantityWithoutCurrentGift = selectedGifts.reduce(
                (total, selectedGift) => {
                    if (selectedGift.id === gift.id) {
                        return total;
                    }

                    return (
                        total +
                        (currentQuantities[selectedGift.id] ||
                            getInitialGiftQuantity(selectedGift))
                    );
                },
                0
            );
            const maxQuantity = Math.min(
                getGiftMaxQuantity(gift),
                Math.max(1, maxSelect - selectedQuantityWithoutCurrentGift)
            );

            return {
                ...currentQuantities,
                [gift.id]: Math.min(maxQuantity, currentQuantity + 1)
            };
        });
    };

    const toggleGiftSelection = gift => {
        setSelectedGiftIds(currentGiftIds => {
            setHasUserChangedSelection(true);

            const currentIds = hasUserChangedSelection
                ? currentGiftIds
                : effectiveSelectedGiftIds;

            if (currentIds.includes(gift.id)) {
                setQuantitiesByGiftId(currentQuantities => {
                    const nextQuantities = { ...currentQuantities };
                    delete nextQuantities[gift.id];
                    return nextQuantities;
                });

                return currentIds.filter(id => id !== gift.id);
            }

            if (maxSelect <= 1) {
                setQuantitiesByGiftId({
                    [gift.id]: getInitialGiftQuantity(gift)
                });

                return [gift.id];
            }

            const selectedQuantity = gifts.reduce((total, giftOption) => {
                if (!currentIds.includes(giftOption.id)) {
                    return total;
                }

                return total + getGiftQuantity(giftOption);
            }, 0);

            if (selectedQuantity >= maxSelect) {
                return currentIds;
            }

            setQuantitiesByGiftId(currentQuantities => ({
                ...currentQuantities,
                [gift.id]: getInitialGiftQuantity(gift)
            }));

            return currentIds.concat(gift.id);
        });
    };

    const handleGiftKeyDown = (event, gift) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleGiftSelection(gift);
        }
    };

    const handleConfirm = async () => {
        if (
            !isSelectionComplete ||
            !selectedGifts.length ||
            !freeGiftOptionsInput ||
            isLoadingOptions ||
            isSwapping
        ) {
            return;
        }

        const response = await swapFreeGift({
            variables: {
                input: buildSwapFreeGiftInput({
                    cartId,
                    itemId,
                    selections: selectedGifts.map(gift => ({
                        sku: gift.sku,
                        qty: getGiftQuantity(gift)
                    }))
                })
            }
        });

        if (response?.data?.swapFreeGift?.success) {
            onClose();

            if (onGiftChanged) {
                await onGiftChanged({ cartId });
            }
        }
    };

    const renderContent = () => {
        if (isLoadingOptions) {
            return <div className={classes.stateMessage}>Loading...</div>;
        }

        if (error && !gifts.length) {
            return <div className={classes.stateMessage}>Unable to load gifts.</div>;
        }

        if (!gifts.length) {
            return <div className={classes.stateMessage}>No gifts available.</div>;
        }

        return gifts.map(gift => {
            const isSelected = effectiveSelectedGiftIds.includes(gift.id);
            const giftQuantity = getGiftQuantity(gift);

            return (
                <div
                    key={gift.id}
                    className={classes.giftOption}
                    onClick={() => toggleGiftSelection(gift)}
                    onKeyDown={event => handleGiftKeyDown(event, gift)}
                    role="button"
                    tabIndex="0"
                >
                    <span
                        className={`${classes.checkbox} ${
                            isSelected ? classes.checkedBox : ''
                        }`}
                        aria-hidden="true"
                    />
                    <div className={classes.giftImageWrapper}>
                        {gift.image && (
                            <img
                                src={gift.image}
                                alt={gift.name}
                                className={classes.giftImage}
                                onError={event => {
                                    event.currentTarget.style.display = 'none';
                                }}
                            />
                        )}
                    </div>
                    <div className={classes.giftInfo}>
                        <div className={classes.giftName}>{gift.name}</div>
                        <div className={classes.giftType}>Free Gift</div>
                    </div>
                    {isSelected && (
                        <div className={classes.quantityStepper}>
                            <button
                                type="button"
                                className={classes.quantityButton}
                                onClick={event => handleDecrease(event, gift)}
                                aria-label="Decrease gift quantity"
                            >
                                -
                            </button>
                            <span className={classes.quantityValue}>{giftQuantity}</span>
                            <button
                                type="button"
                                className={`${classes.quantityButton} ${classes.quantityPlus}`}
                                onClick={event => handleIncrease(event, gift)}
                                aria-label="Increase gift quantity"
                                disabled={giftQuantity >= gift.maxQuantity}
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
            );
        });
    };

    const notice = (
        <div className={classes.notice} id="gift-change-modal-message">
            <span className={classes.noticeIcon}>i</span>
            <span>{noticeLabel}</span>
        </div>
    );

    const errorMessage = (swapError || swapData?.swapFreeGift?.message) && (
        <div className={classes.errorMessage}>
            {swapError?.message || swapData?.swapFreeGift?.message}
        </div>
    );

    const confirmButton = (
        <button
            type="button"
            className={classes.confirmButton}
            onClick={handleConfirm}
            disabled={isSwapping || isLoadingOptions || !isSelectionComplete}
        >
            {confirmButtonLabel}
        </button>
    );

    if (isDrawerVariant) {
        const drawerPanel = (
            <div
                className={classes.drawerPanel}
                role="dialog"
                aria-modal="false"
                aria-labelledby="gift-change-drawer-title"
                onMouseDown={event => event.stopPropagation()}
                onTouchStart={event => event.stopPropagation()}
                onClick={event => event.stopPropagation()}
            >
                <div className={classes.drawerHeader}>
                    <button
                        type="button"
                        className={classes.drawerBackButton}
                        onClick={event => {
                            event.stopPropagation();
                            onClose();
                        }}
                        aria-label="Back to shopping cart"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <div
                        className={classes.drawerTitle}
                        id="gift-change-drawer-title"
                    >
                        Free item
                    </div>
                </div>
                <div className={classes.drawerBody}>
                    {notice}
                    <div className={classes.giftList}>{renderContent()}</div>
                    {errorMessage}
                </div>
                <div className={classes.drawerFooter}>{confirmButton}</div>
            </div>
        );

        return typeof document === 'undefined'
            ? drawerPanel
            : createPortal(drawerPanel, document.body);
    }

    return (
        <div className={classes.overlay} role="presentation" onClick={onClose}>
            <div
                className={classes.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="gift-change-modal-message"
                onClick={event => event.stopPropagation()}
            >
                {notice}

                <div className={classes.giftList}>{renderContent()}</div>

                {errorMessage}

                {confirmButton}
            </div>
        </div>
    );
};

export default GiftChangeModal;
