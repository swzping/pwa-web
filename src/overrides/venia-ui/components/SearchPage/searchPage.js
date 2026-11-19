import React, { Fragment, Suspense, useMemo, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { shape, string } from 'prop-types';
import { useLocation } from 'react-router-dom';

import { useSearchPage } from '@magento/peregrine/lib/talons/SearchPage/useSearchPage';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Pagination from '@magento/venia-ui/lib/components/Pagination';
import Gallery, { GalleryShimmer } from '@magento/venia-ui/lib/components/Gallery';
import ProductSort, { ProductSortShimmer } from '@magento/venia-ui/lib/components/ProductSort';
import defaultClasses from '@magento/venia-ui/lib/components/SearchPage/searchPage.module.css';
import SortedByContainer, { SortedByContainerShimmer } from '@magento/venia-ui/lib/components/SortedByContainer';
import FilterModalOpenButton, {
    FilterModalOpenButtonShimmer,
} from '@magento/venia-ui/lib/components/FilterModalOpenButton';
import { FilterSidebarShimmer } from '@magento/venia-ui/lib/components/FilterSidebar';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import SearchBar from '@magento/venia-ui/lib/components/SearchBar';
import QuickFilterChips from '../QuickFilterChips';
import FilterEmptyState from '../FilterEmptyState';
import { SORT_OPTIONS_SEARCH } from '../../../../modules/plp-filter/sortOptions';
import LayoutSwitcher from '../../../../modules/swift-pwa-ui/components/LayoutSwitcher';
import { applyCategoryFacet } from '../../../../modules/plp-filter/filterRenderers';
import { countAppliedFromUrl } from '../../../../modules/plp-filter/filterPayload';
import useGuidFilterBootstrap from '../../../../modules/plp-filter/useGuidFilterBootstrap';

const FilterModal = React.lazy(() => import('@magento/venia-ui/lib/components/FilterModal'));
const FilterSidebar = React.lazy(() => import('@magento/venia-ui/lib/components/FilterSidebar'));

const SearchPage = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const talonProps = useSearchPage();
    const {
        data,
        error,
        filters,
        loading,
        pageControl,
        searchCategory,
        searchTerm,
        sortProps,
        layoutSwitcherProps,
        layoutSwitcherOptions,
        loadMoreCategory,
        pageSizeCategory,
        isPhone,
        isBackgroundLoading,
    } = talonProps;

    const { formatMessage } = useIntl();
    const [currentSort] = sortProps;
    const [currentSwitcher] = layoutSwitcherProps;

    const [dataProductAlertMessage, setDataProductAlertMessage] = useState([]);

    const handleScroll = () => {
        const lastUserLoaded = document.querySelector('.latest-product-indicator');
        if (lastUserLoaded) {
            const lastUserLoadedOffset = lastUserLoaded.offsetTop + lastUserLoaded.clientHeight;
            const pageOffset = window.pageYOffset + window.innerHeight;
            if (
                pageOffset > lastUserLoadedOffset &&
                !!loadMoreCategory &&
                data?.products?.items?.length < data?.products?.total_count &&
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

    // applied-filter count straight from the URL — a filtered
    // empty result shows the clear-filters empty state (app
    // parity) instead of the bare "No results found!" text
    const { search: locationSearch } = useLocation();
    const appliedFilterCount = useMemo(() => countAppliedFromUrl(locationSearch), [locationSearch]);

    const content = useMemo(() => {
        if (!data && loading) {
            return (
                <Fragment>
                    <section className={classes.gallery}>
                        <GalleryShimmer items={Array.from({ length: pageSizeCategory }).fill(null)} />
                    </section>
                    <section className={classes.pagination} />
                </Fragment>
            );
        }

        if (!data && error) {
            return (
                <div className={classes.noResult}>
                    <FormattedMessage
                        id={'searchPage.noResult'}
                        defaultMessage={'No results found. The search term may be missing or invalid.'}
                    />
                </div>
            );
        }

        if (!data?.products) {
            return null;
        }

        if (data.products.items.length === 0) {
            // H5-only (app parity): desktop keeps the bare
            // "No results found!" text
            if (appliedFilterCount > 0 && isPhone) {
                return <FilterEmptyState />;
            }
            return (
                <div className={classes.noResult}>
                    <FormattedMessage id={'searchPage.noResultImportant'} defaultMessage={'No results found!'} />
                </div>
            );
        } else {
            return (
                <div className={classes.galleryContent}>
                    <section className={classes.gallery}>
                        <Gallery
                            layout={currentSwitcher}
                            items={data.products.items}
                            setDataProductAlertMessage={setDataProductAlertMessage}
                            pageView="search"
                            trackData={{
                                locationName: 'search',
                            }}
                        />
                    </section>
                    {!isPhone && (
                        <section className={classes.pagination}>
                            <Pagination pageControl={pageControl} />
                        </section>
                    )}
                </div>
            );
        }
    }, [
        appliedFilterCount,
        isPhone,
        classes.gallery,
        classes.noResult,
        classes.pagination,
        error,
        loading,
        data,
        pageControl,
    ]);

    const productsCount = data && data.products && data.products.total_count ? data.products.total_count : 0;

    // Search passes no categoryId — guidCategoryFacet returns
    // the store's L1 categories (app parity). The facet stays
    // undefined while the bootstrap query runs, so
    // displayFilters reads as the legacy aggregation list in
    // the meantime; on load, applyCategoryFacet swaps in the
    // synthetic category facet (or hides the section when the
    // facet is empty).
    const { quickFilterSettings, categoryFacet, bootstrapLoading } = useGuidFilterBootstrap();
    const displayFilters = useMemo(() => applyCategoryFacet(filters, categoryFacet), [filters, categoryFacet]);

    const shouldShowFilterButtons = displayFilters && displayFilters.length;
    const shouldShowFilterShimmer = filters === null;

    // If there are no products we can hide the sort button.
    const shouldShowSortButtons = productsCount;
    const shouldShowSortShimmer = !productsCount && loading;

    // the Filter entry pill moves into the quick-chips row
    // (app parity); only the loading shimmer stays in the
    // tools row
    const maybeFilterButton = shouldShowFilterButtons ? (
        <FilterModalOpenButton filters={displayFilters} pageContext={{ searchTerm, isSearch: true }} />
    ) : null;

    const maybeFilterButtonShimmer = shouldShowFilterShimmer ? <FilterModalOpenButtonShimmer /> : null;

    const maybeFilterModal = shouldShowFilterButtons ? (
        <FilterModal filters={displayFilters} pageContext={{ searchTerm, isSearch: true }} />
    ) : null;

    const maybeSidebar = shouldShowFilterButtons ? (
        <FilterSidebar filters={displayFilters} isSearch={true} />
    ) : shouldShowFilterShimmer ? (
        <FilterSidebarShimmer />
    ) : null;

    const categorySearchBar = isPhone ? (
        <div className={classes.categorySearchBar}>
            <SearchBar sortProps={sortProps} />
        </div>
    ) : null;

    const maybeSortButton = shouldShowSortButtons ? (
        <ProductSort sortProps={sortProps} availableSortMethods={SORT_OPTIONS_SEARCH} />
    ) : shouldShowSortShimmer ? (
        <ProductSortShimmer />
    ) : null;

    const maybeSortContainer = shouldShowSortButtons ? (
        <SortedByContainer currentSort={currentSort} />
    ) : shouldShowSortShimmer ? (
        <SortedByContainerShimmer />
    ) : null;

    const maybeLayoutSwitcher = shouldShowSortButtons ? (
        <LayoutSwitcher layoutSwitcherProps={layoutSwitcherProps} options={layoutSwitcherOptions} />
    ) : null;

    const searchResultsHeading = loading ? (
        <Shimmer width={5} />
    ) : !data ? null : searchTerm ? (
        <FormattedMessage
            id={'searchPage.searchTerm'}
            values={{
                highlight: chunks => <span className={classes.headingHighlight}>{chunks}</span>,
                category: searchCategory,
                term: searchTerm,
            }}
            defaultMessage={'Showing results:'}
        />
    ) : (
        <FormattedMessage id={'searchPage.searchTermEmpty'} defaultMessage={'Showing all results:'} />
    );

    const itemCountHeading =
        data && !loading ? (
            <span className={classes.totalPages}>
                {formatMessage(
                    {
                        id: 'searchPage.totalPages',
                        defaultMessage: `items`,
                    },
                    { totalCount: productsCount },
                )}
            </span>
        ) : loading ? (
            <Shimmer width={5} />
        ) : null;

    return (
        <>
            {dataProductAlertMessage && dataProductAlertMessage.message && (
                <div className={classes.productNotify} id="product-notify-wrapper">
                    <img className={classes.productNotifyImage} src="/venia-static-assets/images/check-circle.png" />
                    <p className={classes.productNotifyText}>
                        {dataProductAlertMessage && dataProductAlertMessage.message}
                    </p>
                </div>
            )}
            <article className={classes.root}>
                <div className={classes.sidebar}>
                    <Suspense fallback={<FilterSidebarShimmer />}>{maybeSidebar}</Suspense>
                </div>
                <div className={classes.searchContent}>
                    <div className={classes.heading}>
                        {/* <div className={classes.categoryLayoutSwitcher}>
                            {maybeLayoutSwitcher}
                        </div> */}
                        {categorySearchBar}
                        {shouldShowFilterButtons ? (
                            /* app parity: the Filter entry pill is the
                               first item of the quick-chips scroll row;
                               加载中传 [] 防止 fallback chips 闪现 */
                            <QuickFilterChips
                                filters={displayFilters}
                                quickFilterSettings={bootstrapLoading ? [] : quickFilterSettings}
                                leading={maybeFilterButton}
                            />
                        ) : null}
                        <div className={classes.searchTools}>
                            <div style={{ color: '#000' }} className={classes.searchInfo}>
                                {/* {searchResultsHeading} */}
                                {itemCountHeading}
                            </div>
                            <div className={classes.headerButtons}>
                                {maybeSortButton}
                                {maybeFilterButtonShimmer}
                            </div>
                        </div>
                    </div>
                    {content}
                    <div className="latest-product-indicator" />
                    <p className={loading ? classes.loadingText : classes.hideLoadingText}>LOADING</p>
                    <Suspense fallback={null}>{maybeFilterModal}</Suspense>
                </div>
            </article>
        </>
    );
};

export default SearchPage;

SearchPage.propTypes = {
    classes: shape({
        noResult: string,
        root: string,
        totalPages: string,
    }),
};
