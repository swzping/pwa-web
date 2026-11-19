import { gql } from '@apollo/client';
import { GET_STORE_CONFIG_INFO } from '../../../../modules/peregrine/talons/Header/header.gql';

// TODO: 待删除
export const GET_STORE_CONFIG_DATA = gql`
    query getStoreConfigForMiniCart {
        # eslint-disable-next-line @graphql-eslint/require-id-when-available
        storeConfig {
            store_code
            product_url_suffix
            configurable_thumbnail_source
            free_shipping_threshold
        }
    }
`;

/**
 * 重置购物车自动应用的优惠券状态。必须在其它购物车请求前调用，
 * 使返回的购物车数据反映重置后的状态。
 */
const RESET_AUTO_APPLY_VOUCHER = gql`
    mutation ResetAutoApplyVoucher($cartId: String!) {
        resetAutoApplyVoucher(input: { cart_id: $cartId }) {
            success
        }
    }
`;

export default {
    getStoreConfigQuery: GET_STORE_CONFIG_INFO,
    resetAutoApplyVoucherMutation: RESET_AUTO_APPLY_VOUCHER
};
