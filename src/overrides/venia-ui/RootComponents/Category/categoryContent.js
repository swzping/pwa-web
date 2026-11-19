import React, { Fragment, Suspense, useMemo, useEffect, useContext, useState, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { array, number, shape, string } from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useCategoryContent } from '@magento/peregrine/lib/talons/RootComponents/Category';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Breadcrumbs from '@magento/venia-ui/lib/components/Breadcrumbs';
import Gallery, { GalleryShimmer } from '@magento/venia-ui/lib/components/Gallery';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import Pagination from '@magento/venia-ui/lib/components/Pagination';
import ProductSort from '@magento/venia-ui/lib/components/ProductSort';
import RichContent from '@magento/venia-ui/lib/components/RichContent';
// import defaultClasses from "@magento/venia-ui/lib/RootComponents/Category/category.module.css";
import defaultClasses from './category.module.css';
import NoProductsFound from '@magento/venia-ui/lib/RootComponents/Category/NoProductsFound';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import SortedByContainer from '@magento/venia-ui/lib/components/SortedByContainer';
import FilterModalOpenButton from '@magento/venia-ui/lib/components/FilterModalOpenButton';
import { FilterSidebarShimmer } from '@magento/venia-ui/lib/components/FilterSidebar';
import QuickFilterChips from '../../components/QuickFilterChips';
import FilterEmptyState from '../../components/FilterEmptyState';
import { SORT_OPTIONS_PLP } from '../../../../modules/plp-filter/sortOptions';
import { applyCategoryFacet } from '../../../../modules/plp-filter/filterRenderers';
import { countAppliedFromUrl } from '../../../../modules/plp-filter/filterPayload';
import useGuidFilterBootstrap from '../../../../modules/plp-filter/useGuidFilterBootstrap';
import LayoutSwitcher from '../../../../modules/swift-pwa-ui/components/LayoutSwitcher';
import { HeaderContext } from '../../../peregrine/context/header';
import SearchBar from '@magento/venia-ui/lib/components/SearchBar';
import styles from './index.module.css';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';

const FilterModal = React.lazy(() => import('@magento/venia-ui/lib/components/FilterModal'));
const FilterSidebar = React.lazy(() => import('@magento/venia-ui/lib/components/FilterSidebar'));

const CategoryContent = props => {
    const {
        categoryId,
        data,
        isLoading,
        pageControl,
        relativePath = '',
        sortProps,
        layoutSwitcherProps,
        layoutSwitcherOptions,
        pageSize,
        pageSizeCategory,
        isPhone,
    } = props;
    const [currentSort] = sortProps;
    const [currentSwitcher] = layoutSwitcherProps;
    const { setNavConfig } = useContext(HeaderContext);
    const [dataProductAlertMessage, setDataProductAlertMessage] = useState([]);
    const [dataProductAlertLoading, setDataProductAlertLoading] = useState(false);

    const categoryImage = data && data?.categories?.items.length ? data?.categories.items[0].image : null;

    const talonProps = useCategoryContent({
        categoryId,
        data,
        pageSize,
    });

    const { categoryName, categoryDescription, filters, items, totalCount, totalPagesFromData } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);

    const { quickFilterSettings, categoryFacet, bootstrapLoading } = useGuidFilterBootstrap({ categoryId });

    // If there are no products we can hide the sort button.
    const shouldShowSortButtons = totalPagesFromData;

    // 筛选请求 loading 中 filters 会短暂变回 undefined，沿用上一次聚合
    // 数据让左栏保持显示；聚合为空数组时也渲染侧栏（仅剩标题），不再隐藏。
    const lastFiltersRef = useRef(null);
    if (filters && filters.length) {
        lastFiltersRef.current = filters;
    }
    const sidebarFilters = filters || lastFiltersRef.current;

    // Category 区改由 GuidFilterBootstrap 的 guidCategoryFacet 驱动
    //（app parity）：facet 未返回（加载中/接口缺失）时维持聚合驱动的
    // 旧行为；空数组 = 该节点无子分类，隐藏 Category 区。
    const displayFilters = useMemo(() => applyCategoryFacet(sidebarFilters, categoryFacet), [
        sidebarFilters,
        categoryFacet,
    ]);

    // applied-filter count straight from the URL — decides
    // whether an empty results list is "filtered empty" (show
    // the clear-filters empty state, app parity) or the
    // category itself has no products (stock NoProductsFound)
    const { search: locationSearch } = useLocation();
    const appliedFilterCount = useMemo(() => countAppliedFromUrl(locationSearch), [locationSearch]);

    const shouldShowFilterButtons = displayFilters && displayFilters.length;

    const maybeFilterButtons = shouldShowFilterButtons ? (
        <FilterModalOpenButton filters={displayFilters} pageContext={{ categoryId }} />
    ) : null;

    const filtersModal = shouldShowFilterButtons ? (
        <FilterModal filters={displayFilters} pageContext={{ categoryId }} />
    ) : null;

    const sidebar = displayFilters ? <FilterSidebar filters={displayFilters} /> : null;

    const categorySearchBar = isPhone ? (
        <div className={classes.categorySearchBar}>
            <SearchBar sortProps={sortProps} />
        </div>
    ) : null;

    const maybeSortButton = shouldShowSortButtons ? (
        <ProductSort sortProps={sortProps} availableSortMethods={SORT_OPTIONS_PLP} />
    ) : null;

    const maybeSortContainer = shouldShowSortButtons ? <SortedByContainer currentSort={currentSort} /> : null;

    const maybeLayoutSwitcher = shouldShowSortButtons ? (
        <LayoutSwitcher layoutSwitcherProps={layoutSwitcherProps} options={layoutSwitcherOptions} />
    ) : null;

    const categoryResultsHeading =
        totalCount > 0 ? (
            <FormattedMessage
                id={'categoryContent.resultCount'}
                values={{
                    count: totalCount,
                }}
                defaultMessage={'{count} Results'}
            />
        ) : null;

    const categoryDescriptionElement = categoryDescription ? <RichContent html={categoryDescription} /> : null;

    const content = useMemo(() => {
        if (totalPagesFromData) {
            return (
                <div className={classes.galleryContent}>
                    <section className={classes.gallery}>
                        <Gallery
                            layout={currentSwitcher}
                            items={items}
                            relativePath={relativePath}
                            setDataProductAlertMessage={setDataProductAlertMessage}
                            setDataProductAlertLoading={setDataProductAlertLoading}
                            pageView="category"
                            trackData={{
                                locationName: 'category',
                            }}
                        />
                    </section>
                    {!isPhone && (
                        <div className={classes.pagination}>
                            <Pagination pageControl={pageControl} />
                        </div>
                    )}
                </div>
            );
        } else {
            if (isLoading) {
                return (
                    <GalleryShimmer items={Array.from({ length: pageSizeCategory }).fill(null)} pageView="category" />
                );
            } else {
                // the clear-filters empty state is H5-only (app
                // parity); desktop keeps the stock empty views
                if (appliedFilterCount > 0 && isPhone) {
                    return <FilterEmptyState />;
                }
                return <NoProductsFound categoryId={categoryId} />;
            }
        }
    }, [
        appliedFilterCount,
        isPhone,
        categoryId,
        classes.gallery,
        classes.pagination,
        isLoading,
        items,
        pageControl,
        totalPagesFromData,
    ]);

    useEffect(() => {
        setNavConfig({
            showMobileNav: true,
            headerTitle: categoryName,
        });
    }, [categoryName]);

    useEffect(() => {
        if (dataProductAlertMessage) {
            const elementNotify = document.getElementById('product-notify-wrapper');
            if (elementNotify) {
                setTimeout(function() {
                    setDataProductAlertMessage([]);
                }, 3000);
            }
        }
    }, [dataProductAlertMessage]);

    return (
        <div className={styles.root}>
            {categoryImage && (
                <div className={classes.categoryImage}>
                    <img alt="Category image" src={categoryImage} />
                </div>
            )}
            <Breadcrumbs categoryId={categoryId} />
            {dataProductAlertMessage && dataProductAlertMessage.message && (
                <div className={classes.productNotify} id="product-notify-wrapper">
                    <img className={classes.productNotifyImage} src="/venia-static-assets/images/check-circle.png" />
                    <p className={classes.productNotifyText}>
                        {dataProductAlertMessage && dataProductAlertMessage.message}
                    </p>
                </div>
            )}
            <StoreTitle>{categoryName}</StoreTitle>
            <article className={classes.root}>
                <div className={classes.categoryHeader}>
                    <h1 className={classes.title}>
                        {!isLoading ? (
                            <div className={classes.categoryTitle}>{categoryName || '...'}</div>
                        ) : (
                            <div className={classes.categoryTitle}>
                                <Shimmer width={'150px'} height={'24px'} />
                            </div>
                        )}
                    </h1>
                    {categorySearchBar}
                    {categoryDescriptionElement}
                </div>
                <div
                    className={classes.contentWrapper}
                    style={{ marginTop: categoryDescriptionElement && !isPhone ? 105 : 0 }}
                >
                    {sidebar ? (
                        <div className={classes.sidebar}>
                            <Suspense fallback={<FilterSidebarShimmer />}>{sidebar}</Suspense>
                        </div>
                    ) : null}
                    <div className={classes.categoryContent}>
                        <div className={classes.heading}>
                            {/* <div className={classes.categoryLayoutSwitcher}>
                                {maybeLayoutSwitcher}
                            </div> */}

                            {shouldShowFilterButtons ? (
                                /* app parity: the Filter entry pill is the
                                   first item of the quick-chips scroll row;
                                   加载中传 [] 防止回落到 boolean 聚合的
                                   fallback chips 闪现 */
                                <QuickFilterChips
                                    filters={displayFilters}
                                    quickFilterSettings={bootstrapLoading ? [] : quickFilterSettings}
                                    leading={maybeFilterButtons}
                                />
                            ) : null}
                            <div className={classes.categoryTools}>
                                <div style={{ color: '#000' }} className={classes.categoryInfo}>
                                    {categoryResultsHeading}
                                </div>
                                <div className={classes.headerButtons}>{maybeSortButton}</div>
                            </div>
                        </div>
                        {content}
                        <div className="latest-product-indicator" />
                        <p className={isLoading ? classes.loadingText : classes.hideLoadingText}>LOADING</p>
                        <Suspense fallback={null}>{filtersModal}</Suspense>
                    </div>
                </div>
            </article>
        </div>
    );
};

export default CategoryContent;

CategoryContent.propTypes = {
    classes: shape({
        filterContainer: string,
        sortContainer: string,
        gallery: string,
        headerButtons: string,
        filterButton: string,
        pagination: string,
        root: string,
        title: string,
    }),
    // sortProps contains the following structure:
    // [{sortDirection: string, sortAttribute: string, sortText: string},
    // React.Dispatch<React.SetStateAction<{sortDirection: string, sortAttribute: string, sortText: string}]
    sortProps: array,
    pageSize: number,
    relativePath: string,
};
