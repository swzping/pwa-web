import React, { Fragment, useEffect, useState } from 'react';
import { number, shape, string } from 'prop-types';
import { useCategory } from '@magento/peregrine/lib/talons/RootComponents/Category';
import { useStyle } from '@magento/venia-ui/lib/classify';

import CategoryContent from '@magento/venia-ui/lib/RootComponents/Category/categoryContent';
import defaultClasses from '@magento/venia-ui/lib/RootComponents/Category/category.module.css';
import { Meta } from '@magento/venia-ui/lib/components/Head';
import { GET_PAGE_SIZE } from '@magento/venia-ui/lib/RootComponents/Category/category.gql';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';
import { useIntl } from 'react-intl';

const MESSAGES = new Map().set(
    'NOT_FOUND',
    "Looks like the category you were hoping to find doesn't exist. Sorry about that."
);

const Category = props => {
    const { uid } = props;
    const { formatMessage } = useIntl();

    const talonProps = useCategory({
        id: uid,
        queries: {
            getPageSize: GET_PAGE_SIZE
        }
    });

    const {
        error,
        metaDescription,
        loading,
        categoryRelativePath,
        categoryData,
        pageControl,
        sortProps,
        layoutSwitcherProps,
        layoutSwitcherOptions,
        pageSize,
        isBackgroundLoading,
        loadMoreCategory,
        pageSizeCategory,
        isPhone,
        categoryNotFound
    } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);

    if (!categoryData) {
        if (error && pageControl.currentPage === 1) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(error);
            }

            return <ErrorView />;
        }
    }
    if (categoryNotFound) {
        return (
            <ErrorView
                message={formatMessage({
                    id: 'category.notFound',
                    defaultMessage: MESSAGES.get('NOT_FOUND')
                })}
            />
        );
    }

    const handleScroll = () => {
        const lastUserLoaded = document.querySelector('.latest-product-indicator');
        if (lastUserLoaded) {
            const lastUserLoadedOffset = lastUserLoaded.offsetTop + lastUserLoaded.clientHeight;
            const pageOffset = window.pageYOffset + window.innerHeight;
            if (
                pageOffset > lastUserLoadedOffset &&
                !!loadMoreCategory &&
                categoryData?.products?.items?.length < categoryData?.products?.total_count &&
                !isBackgroundLoading
            ) {
                loadMoreCategory();
            }
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });

    return (
        <Fragment>
            <Meta name="description" content={metaDescription} />
            <CategoryContent
                categoryId={uid}
                classes={classes}
                data={categoryData}
                isLoading={loading}
                pageControl={pageControl}
                relativePath={categoryRelativePath}
                sortProps={sortProps}
                layoutSwitcherProps={layoutSwitcherProps}
                layoutSwitcherOptions={layoutSwitcherOptions}
                pageSize={pageSize}
                pageSizeCategory={pageSizeCategory}
                isPhone={isPhone}
            />
        </Fragment>
    );
};

Category.propTypes = {
    classes: shape({
        gallery: string,
        root: string,
        title: string
    }),
    uid: string
};

Category.defaultProps = {
    uid: 'Mg=='
};

export default Category;
