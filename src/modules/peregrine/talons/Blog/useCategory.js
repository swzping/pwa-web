import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useToasts } from '@magento/peregrine';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { usePagination } from '@magento/peregrine';
import { getAllPost, getCategory, filterCategorybyUrlKey } from './Blog.gql';

const errorIcon = <Icon src={AlertCircleIcon} attrs={{ width: 18 }} />;

export const useCategory = props => {
    const [pageSize, setPageSize] = useState(5);
    const [paginationValues, paginationApi] = usePagination();
    const { currentPage, totalPages } = paginationValues;
    const { setCurrentPage, setTotalPages } = paginationApi;

    const pageControl = {
        currentPage,
        setPage: setCurrentPage,
        totalPages
    };

    const { data: categoryData, loading: categoryLoading, error: categoryError  } = useQuery(
        filterCategorybyUrlKey, 
        {
            variables: { 
                url_key: props.categoryUrl,
            },
            skip: !props.categoryUrl
        }
    );

    const { loading: blogLoading, data: blogData, error: blogError } = useQuery(
        getAllPost,
        {
            variables: {
                page_size: pageSize,
                current_page: currentPage,
                category_id: categoryData ? categoryData.getBlogCategory.data[0].id : 0,
                id: 0
            },
            skip: !props.categoryUrl
        }
    );

    const { data: allCategoryData, loading: allCategoryLoading } = useQuery(
        getCategory
    );

    // Set the total number of pages whenever the data changes.
    useEffect(() => {
        const totalPagesFromData =
            blogData && blogData.getBlogByFilter.items.length
                ? blogData.getBlogByFilter.total_pages
                : null;
        setTotalPages(totalPagesFromData);
        return () => {
            setTotalPages(null);
        };
    }, [blogData, setTotalPages]);

    const [, { addToast }] = useToasts();

    if (blogError) {
        let derivedErrorMessage;
        const errorTarget = blogError;
        if (errorTarget.graphQLErrors) {
            derivedErrorMessage = errorTarget.graphQLErrors
                .map(({ message }) => message)
                .join(', ');
        } else {
            derivedErrorMessage = errorTarget.message;
        }
        if (derivedErrorMessage) {
            if (currentPage && currentPage > 1) {
                window.location.href = '/blog';
            } else {
                addToast({
                    type: 'error',
                    icon: errorIcon,
                    message: derivedErrorMessage,
                    dismissable: true,
                    timeout: 7000
                });
            }
        }
    }

    return {
        blogData,
        blogLoading,
        blogError,
        pageControl,
        pageSize,
        setPageSize,
        categoryData,
        categoryLoading,
        allCategoryData,
        allCategoryLoading
    };
};
