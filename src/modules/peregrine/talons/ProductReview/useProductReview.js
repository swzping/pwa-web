import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useWindowSize } from '@magento/peregrine';
import { getReviewQuery, addReviewMutation } from './productReview.gql';

export const useProductReview = props => {
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 1024;

    const [page, setPage] = useState(isMobile ? 3 : 100);
    const [currentPage, setCurrentPage] = useState(1);
    const [status, setStatus] = useState(false);
    const [isModal, setModal] = useState(false);
    const [displayError, setDisplayError] = useState(false);


    const productReviewResult = useQuery(getReviewQuery, {
        fetchPolicy: 'cache-and-network',
        variables: {
            sku: props.sku || '',
            pageSize: page,
            currentPage: currentPage
        }
    });

    const [
        addReview,
        {
            loading: addReviewLoading,
            error: addReviewError,
            data: addReviewData
        }
    ] = useMutation(addReviewMutation);

    const loadMore = useCallback(() => {
        if (isMobile && productReviewResult.data) {
            const {
                totalCount,
                items
            } = productReviewResult.data.getProductReviews;

            if (totalCount !== items.length) {
                setPage(page + 3);
            } else {
                setPage(3);
            }
        }

        return null;
    }, [productReviewResult.data]);

    const handleCancel = useCallback(() => {
        setModal(false);
    }, [setModal]);

    const showModal = useCallback(() => {
        setModal(true);
        setDisplayError(false);
    }, [setModal]);

    const handleSubmit = useCallback(
        async ({ nickname, title, rating, detail }) => {
            setStatus(false);
            try {
                await addReview({
                    variables: {
                        nickname,
                        rating,
                        title,
                        detail,
                        pkValue: props.id
                    }
                });
            } catch {
                setDisplayError(true);
                return;
            }
            setStatus(true);
        },
        [addReview, setDisplayError]
    );

    const errors = displayError ? [addReviewError] : [];

    const totalCount = productReviewResult.data && productReviewResult.data.getProductReviews ? productReviewResult.data.getProductReviews.totalCount : 0

    const totalPages = totalCount/page

    return {
        productReviewData:
            productReviewResult.data &&
            productReviewResult.data.getProductReviews,
        productReviewLoading: Boolean(productReviewResult.loading),
        productReviewError: Boolean(productReviewResult.error),
        productReviewResponse: addReviewData && addReviewData.addProductReview,
        isDisabled: Boolean(addReviewLoading),
        formErrors: errors,
        isModal,
        loadMore,
        status,
        handleSubmit,
        handleCancel,
        showModal,
        pageControl: {
            currentPage,
            setPage: setCurrentPage,
            totalPages: totalPages
        }
    };
};
