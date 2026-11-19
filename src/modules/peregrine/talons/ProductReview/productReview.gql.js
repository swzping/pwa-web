import { gql } from '@apollo/client';

export const getReviewQuery = gql`
    query getReview($sku: String!, $pageSize: Int, $currentPage: Int) {
        getProductReviews(
            sku: $sku
            pageSize: $pageSize
            currentPage: $currentPage
        ) {
            items {
                id
                nickname
                ratings {
                    rating_name
                    value
                }
                entity_pk_value
                review_entity
                review_type
                review_status
                title
                detail
                created_at
            }
            message
            totalCount
        }
    }
`;

export const addReviewMutation = gql`
    mutation createReview(
        $nickname: String!
        $rating: Int!
        $title: String!
        $detail: String!
        $pkValue: Int!
    ) {
        addProductReview(
            input: {
                entity_pk_value: $pkValue
                title: $title
                detail: $detail
                nickname: $nickname
                ratings: { rating_name: "Rating", value: $rating }
            }
        ) {
            message
        }
    }
`;
