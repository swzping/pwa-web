import React, { useEffect, useState, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { ShoppingBag, XSquare } from 'react-feather';
import { Form } from 'informed';
import Button from '@magento/venia-ui/lib/components/Button';
import Icon from '@magento/venia-ui/lib/components/Icon';
import addToCartButtonClasses from '@magento/venia-ui/lib/components/Gallery/addToCartButton.module.css';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import QuantityStepper from '@magento/venia-ui/lib/components/QuantityStepper';
// import { useToasts } from '@magento/peregrine';
import styles from './addToCart.module.css';
import AddToCartModal from './addToCartModal';
import { useAddToCartButton } from '../../../../overrides/peregrine/talons/Gallery/useAddToCartButton';
import { useProductNotifyMe } from '../../../peregrine/talons/ProductNotifyMe/useProductNotifyMe';
import { useAllowGuestCheckout } from '../../../peregrine/talons/AllowGuestCheckout/useAllowGuestCheckout';

const addToCart = ({
    productData,
    productLink,
    relativePath,
    alwaysInline = false,
    isSelectionDisabled = false,
    selectedOptions = null,
    setDataProductAlertMessage = () => {},
    pageView = '',
    setDataProductAlertLoading = () => {},
    onAddToCartSuccess = () => {}
}) => {
    const history = useHistory();
    const { formatMessage } = useIntl();
    const [{ isSignedIn }] = useUserContext();
    const [formValues, setFormValues] = useState({})
    const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
    // const [, { addToast }] = useToasts();

    // const successAddToCartProps = () => {
    //     addToast({
    //         type: 'success',
    //         message: 'Success add item to cart',
    //         dismissable: true,
    //         timeout: 3000
    //     });
    // }

    const {
        // errorMessage,
        handleAddToCart,
        handleUpdateItemQuantity,
        cartId,
        product,
        isDisabled,
        isInStock,
        addToCartData,
        errorQtyMessage,
        dataCustomer,
        lastSuccessfulQuantity,
        quantityResetTrigger
    } = useAddToCartButton({ item: productData, relativePath, selectedOptions });

    const {
        productAlertNotifyResponse,
        errorProductAlertNotify,
        isDisableProductAlertNotify,
        handleSubmit
    } = useProductNotifyMe({
        item: productData, view: history.location.pathname === '/' ? 'home' : ''
    });

    const {
        isAllowGuestCheckout,
        isLoadingAllowGuestCheckout,
    } = useAllowGuestCheckout();

    const { quantity = 0 } = product || {};

    // Use lastSuccessfulQuantity when there's an error to revert the input
    // This will cause QuantityStepper to reset to the last successful quantity
    const displayQuantity = lastSuccessfulQuantity !== null ? lastSuccessfulQuantity : quantity;

    const colClasses = alwaysInline ? 'col-6' : 'col-sm-6';
    const hasSelectedOptions = Array.isArray(selectedOptions);
    const isConfigurableProduct =
        productData?.__typename === 'ConfigurableProduct' ||
        productData?.type_id === 'configurable';
    const shouldOpenAddToCartModal =
        !!productData?.variant_parent_sku || isConfigurableProduct;

    const handleInStockClick = event => {
        if (!hasSelectedOptions && shouldOpenAddToCartModal) {
            event.preventDefault();
            setIsAddToCartModalOpen(true);
            return;
        }

        handleAdd({
            ...formValues,
            ...(hasSelectedOptions && selectedOptions.length
                ? {
                      selected_options: selectedOptions
                  }
                : {})
        });
    };

    const handleAdd = value => {
        if (!isSignedIn && !isAllowGuestCheckout) {
            history.push(`/sign-in?redirect=/${productData.url_key}.html`);
        } else {
            if (
                (productData && productData.__typename == 'SimpleProduct') ||
                (productData && productData.__typename == 'DownloadableProduct') ||
                (productData && productData.__typename == 'VirtualProduct') ||
                value?.selected_options?.length
            ) {
                // handle simple, downloadable, virtual, and selected configurable products
                handleAddToCart(value);
            } else {
                // handle not simple product
                history.push(productLink);
            }
        }
    };

    const handleProductNotify = value => {
        if (!isSignedIn) {
            history.push(`/sign-in?redirect=/${productData.url_key}.html`);
        }
        else if (value && isSignedIn && dataCustomer && dataCustomer.customer && dataCustomer.customer.email) {
            handleSubmit(dataCustomer.customer);
        }
    }

    useEffect(() => {
        if (productAlertNotifyResponse && pageView === 'category') {
            setDataProductAlertMessage(productAlertNotifyResponse);
        }
    }, [productAlertNotifyResponse])

    // 监听添加到购物车成功
    useEffect(() => {
        if (addToCartData && addToCartData.addProductsToCart.toastr_message.status === true) {
            onAddToCartSuccess(addToCartData.addProductsToCart.toastr_message.message);
        }
    }, [addToCartData, onAddToCartSuccess])

    const buttonInStock = (
        <Button
            aria-label={formatMessage({
                id: 'addToCartButton.addItemToCartAriaLabel',
                defaultMessage: 'Add to Cart'
            })}
            className={addToCartButtonClasses.root}
            disabled={isDisabled || isSelectionDisabled || isLoadingAllowGuestCheckout}
            loading={isDisabled || isSelectionDisabled || isLoadingAllowGuestCheckout}
            priority="high"
            type="submit"
            onClick={handleInStockClick}
        >
            <i className="icon-white_cart" />
            <span className={addToCartButtonClasses.text}>
                <FormattedMessage
                    id="addToCart.addItemToCart"
                    defaultMessage="Add to Cart"
                />
            </span>
        </Button>
    );

    const [isMaxQty, setIsMaxQty] = useState(false)

    const buttonOutOfStock = (
        <Button
            aria-label={formatMessage({
                id: 'addToCartButton.notifyMe',
                defaultMessage: 'Notify Me'
            })}
            className={addToCartButtonClasses.root}
            priority="high"
            type='submit'
            onClick={() => { handleProductNotify(formValues) }}
        >
            <span className={addToCartButtonClasses.text}>
                <FormattedMessage
                    id="addToCartButton.notifyMe"
                    defaultMessage="Notify Me"
                />
            </span>
        </Button>
    );

    return (
        <div className={`add-to-cart ${styles.root}`}>
            <Form onChange={({ values }) => {
                setFormValues(values)
            }}>
                <div className={styles.AddToCartContent}>
                    {displayQuantity ? (
                        <div
                            className={
                                isInStock
                                    ? 'col-span-2'
                                    : 'wrapper-oos-f col-span-1'
                            }
                        >
                            {isInStock ? (
                                <QuantityStepper
                                    key={`qty-${cartId}-${productData.id}-${quantityResetTrigger}`}
                                    itemId={productData.id}
                                    initialValue={displayQuantity}
                                    onChange={handleUpdateItemQuantity}
                                    min={1}
                                />
                            ) : (
                                <div className="oos-field">
                                    <p className="oos-text">Out of Stock</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="col-span-2">
                            {isInStock ? buttonInStock : buttonOutOfStock}
                        </div>
                    )}
                </div>
            </Form>
            {addToCartData && errorQtyMessage && (
                <div className={styles.errorQty} title={errorQtyMessage}>
                    <span className={styles.errorQtyText}>
                        {errorQtyMessage}
                    </span>
                </div>
            )}
            <AddToCartModal
                formValues={formValues}
                isOpen={isAddToCartModalOpen}
                onClose={() => setIsAddToCartModalOpen(false)}
                onConfirm={handleAdd}
                onNotify={handleProductNotify}
                initialSelectedOptionUids={productData?.variant_preselected_options}
                productData={productData}
                showFallbackOptions={false}
            />
        </div>
    );
};

export default addToCart;
