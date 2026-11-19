import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useQuery } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import Price from '@magento/venia-ui/lib/components/Price';
import { GET_SELECTED_AND_AVAILABLE_SHIPPING_METHODS } from '@magento/peregrine/lib/talons/CheckoutPage/ShippingMethod/shippingMethod.gql';

/**
 * A component that renders the shipping summary line item after address and
 * method are selected
 */
const ShippingSummary = props => {
    const { data, isCheckout } = props;
    const { formatMessage } = useIntl();
    
    // 获取包含 amount_before_discount 的运费数据
    const [{ cartId }] = useCartContext();
    const { data: shippingData } = useQuery(GET_SELECTED_AND_AVAILABLE_SHIPPING_METHODS, {
        fetchPolicy: 'cache-and-network',
        skip: !cartId,
        variables: { cartId }
    });

    // Don't render estimated shipping until an address has been provided and
    // a method has been selected.
    if (!data.length || !data[0].selected_shipping_method) {
        return null;
    }

    const shippingLabel = isCheckout
        ? formatMessage({
              id: 'shippingSummary.shipping',
              defaultMessage: 'Shipping'
          })
        : formatMessage({
              id: 'shippingSummary.estimatedShipping',
              defaultMessage: 'Estimated Shipping'
          });

    // 优先使用 amount_before_discount，如果没有则使用 amount
    let priceToUse = data[0].selected_shipping_method.amount;
    
    if (shippingData?.cart?.shipping_addresses?.[0]?.selected_shipping_method?.amount_before_discount?.value) {
        priceToUse = shippingData.cart.shipping_addresses[0].selected_shipping_method.amount_before_discount;
    }

    // For a value of "0", display "FREE".
    const price = priceToUse.value ? (
        <Price value={priceToUse.value} currencyCode={priceToUse.currency} />
    ) : (
        <span>
            <FormattedMessage id={'global.free'} defaultMessage={'FREE'} />
        </span>
    );

    return (
        <>
            <span className={props.classes.lineItemLabel}>{shippingLabel}</span>
            <span
                data-cy="ShippingSummary-shippingValue"
                className={props.classes.price}
            >
                {price}
            </span>
        </>
    );
};

export default ShippingSummary;
