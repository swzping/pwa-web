import { gql } from '@apollo/client';

import { DiscountSummaryFragment } from '@magento/peregrine/lib/talons/CartPage/PriceSummary/discountSummary.gql';
import { GiftCardSummaryFragment } from '@magento/peregrine/lib/talons/CartPage/PriceSummary/queries/giftCardSummary';
import { ShippingSummaryFragment } from '@magento/peregrine/lib/talons/CartPage/PriceSummary/shippingSummary.gql';
import { TaxSummaryFragment } from '@magento/peregrine/lib/talons/CartPage/PriceSummary/taxSummary.gql';

export const GrandTotalFragment = gql`
    fragment GrandTotalFragment on CartPrices {
        grand_total {
            currency
            value
        }
    }
`;

export const AwRafDiscountFragment = gql`
    fragment AwRafDiscountFragment on CartPrices {
        aw_raf_discount {
            status
            name
            value {
                currency
                discount_amount
                discount_base_amount
                percent_amount
                discount_type
            }
        }
    }
`;

export const PromotionSummaryFragment = gql`
    fragment PromotionSummaryFragment on CartPrices {
        promotions {
            amount {
            currency
            value
            __typename
            }
            label
            __typename
        }
        __typename
    }
`

export const PriceSummaryFragment = gql`
    fragment PriceSummaryFragment on Cart {
        id
        total_quantity
        ...ShippingSummaryFragment
        prices {
            ...TaxSummaryFragment
            ...DiscountSummaryFragment
            ...GrandTotalFragment
            ...AwRafDiscountFragment
            ...PromotionSummaryFragment
            subtotal_after_discounts {
                currency
                value
                __typename
            }
            loyalty_points {
                point
                loyalty_points_total {
                    value
                    currency
                }
            }
            subtotal_excluding_tax {
                currency
                value
            }
        }
        ...GiftCardSummaryFragment
    }
    ${AwRafDiscountFragment}
    ${DiscountSummaryFragment}
    ${GiftCardSummaryFragment}
    ${ShippingSummaryFragment}
    ${GrandTotalFragment}
    ${TaxSummaryFragment}
    ${PromotionSummaryFragment}
`;

export const PriceSummaryFragmentCart = gql`
    fragment PriceSummaryFragmentCart on Cart {
        id
        total_quantity
        ...ShippingSummaryFragment
        prices {
            ...TaxSummaryFragment
            ...DiscountSummaryFragment
            ...GrandTotalFragment
            ...AwRafDiscountFragment
            ...PromotionSummaryFragment
            subtotal_after_discounts {
                currency
                value
                 __typename
            }
            subtotal_excluding_tax {
                currency
                value
            }
            loyalty_points {
                point
                loyalty_points_total {
                    value
                    currency
                }
            }
        }
        ...GiftCardSummaryFragment
        items {
            uid
            product {
                uid
                stock_status
                stock_item {
                    salable_qty
                }
            }
            quantity
        }
    }
    ${AwRafDiscountFragment}
    ${DiscountSummaryFragment}
    ${GiftCardSummaryFragment}
    ${ShippingSummaryFragment}
    ${GrandTotalFragment}
    ${TaxSummaryFragment}
    ${PromotionSummaryFragment}
`;
