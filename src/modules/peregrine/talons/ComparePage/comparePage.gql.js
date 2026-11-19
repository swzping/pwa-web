import { gql } from '@apollo/client';

export const getCustomerUid = gql`
    query getCustomerUid {
        customer {
            compare_list {
                uid
            }
        }
    }
`;

export const getCompareList = gql`
    query getCompareList ($uid: ID!) {
        compareList(uid: $uid) {
            uid
            item_count
            attributes {
                code
                label
            }
            items {
                uid
                product {
                    id
                    sku
                    name
                    brand
                    url_key
                    description {
                        html
                    }
                    short_description {
                        html
                    }
                    small_image {
                        url
                    }
                    price_range {
                        maximum_price {
                            discount {
                                amount_off
                                percent_off
                            }
                            final_price {
                                currency
                                value
                            }
                            fixed_product_taxes {
                                amount {
                                    currency
                                    value
                                }
                                label
                            }
                            regular_price {
                                currency
                                value
                            }
                        }
                        minimum_price {
                            discount {
                                amount_off
                                percent_off
                            }
                            final_price {
                                currency
                                value
                            }
                            fixed_product_taxes {
                                amount {
                                    currency
                                    value
                                }
                                label
                            }
                            regular_price {
                                currency
                                value
                            }
                        }
                    }
                }
            }
        }
    }
`;

export const removeProductsFromCompareList = gql`
    mutation removeProductsFromCompareList($uid: ID!, $products: [ID]!) {
        removeProductsFromCompareList(input: { uid: $uid, products: $products }) {
            uid
            item_count
            attributes {
                code
                label
            }
            items {
                uid
                product {
                    id
                    sku
                    name
                    description {
                        html
                    }
                }
            }
        }
    }
`;

export default {
    getCompareListQuery: getCompareList,
    getCustomerUidQuery: getCustomerUid,
    removeProductsFromCompareListMutation: removeProductsFromCompareList,
};
