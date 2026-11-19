import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { getReview } from './productReview.gql';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';

export const useProductReviewPage = () => {
    const [page, setPage] = useState(0);
    const [perPage, setRowsPerPage] = useState(10);

    const [{ isSignedIn }] = useUserContext();

    const {
        data: productReviewData,
        loading: productReviewLoading,
        error: productReviewError
    } = useQuery(getReview, {
        variables: {
            pageSizeReview: perPage,
            currentPageReview: page + 1
        },
        skip: !isSignedIn
    });

    let reviewCustomer = null;

    if (productReviewData) {
        reviewCustomer = productReviewData.customer.reviews;
    }

    const derivedErrorMessage = useMemo(
        () => deriveErrorMessage([productReviewError]),
        [productReviewError]
    );

    return {
        reviewCustomer,
        productReviewData,
        productReviewLoading,
        productReviewError,
        errorMessage: derivedErrorMessage        
    };
};
