import React, { useEffect, useMemo, useState, useContext, useRef } from 'react';
import Pagination from '@magento/venia-ui/lib/components/Pagination';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './myCoupon.module.css';
import DEFAULT_OPERATIONS from './myCoupon.gql';
import { FormattedMessage } from 'react-intl';
import { useLazyQuery, useMutation } from '@apollo/client';
import { useToasts } from '@magento/peregrine/lib/Toasts';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import CouponCard from './components/couponCard';
import CouponNoData from './components/couponNoData';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import PopUpWindow from '../../../../overrides/venia-ui/components/PopUpWindow/popUpWindow';
import CouponPopUpDetails from '../../../../overrides/pagebuilder/ContentTypes/CouponCampaign/components/couponPopUpDetails/couponPopDetails';
import CouponDetail from '../../../../overrides/pagebuilder/ContentTypes/CouponCampaign/components/couponDeatial/coupouDeatial';
import RedeemCouponModal from './components/redeemCouponModal';
import OfflineCouponDetail from './offlineCouponDetail/index';
import CouponFilter from '@/modules/custom-modules/components/CustomAccountInformation/components/selectOrderList';
import OrderTabs from '@/modules/custom-modules/components/OrderTabs/orderListTabs';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import { LoadingMoreIcon } from '@/assets/icons';

const _setPageSize = 9;

const _couponSortList = [
    {
        value: 'valid',
        label: <FormattedMessage id={'couponListSort.Valid'} defaultMessage={'Valid'} />,
    },
    {
        value: 'used',
        label: <FormattedMessage id={'couponListSort.Used'} defaultMessage={'Used'} />,
    },
];

const MyCouponList = props => {
    const operations = mergeOperations(DEFAULT_OPERATIONS);
    const { getCouponWallet, getOfflineVouchers, redeemOfflineVoucher } = operations;
    const classes = useStyle(defaultClasses);
    const [, { addToast }] = useToasts();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [openOfflineModal, setOpenOfflineModal] = useState(false); // 线下优惠券弹窗
    const [openOfflineDetailModal, setOpenOfflineDetailModal] = useState(false); // 线下优惠券详情弹窗
    const [sortCurrent, setSortCurrent] = useState(_couponSortList[0]); // 当前优惠券排序
    const [isMobile, setIsPhone] = useState(window.innerWidth < 767);

    const categoryList = [{ code: 'ONLINE', label: 'Online' }, { code: 'OFFLINE', label: 'Offline' }];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [couponData, setCouponData] = useState({});
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [isClick, setIsClick] = useState(true);
    const [mobileCoupons, setMobileCoupons] = useState([]);
    const isLoadingMore = useRef(false);

    const { setNavConfig } = useContext(HeaderContext);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'My Vouchers',
            useCart: false,
        });
    }, []);

    const resizePhone = () => {
        window.onresize = function() {
            const width = window.innerWidth;
            const newIsPhone = width < 767;
            if (isMobile !== newIsPhone) {
                setIsPhone(newIsPhone);
            }
        };
    };

    useEffect(() => {
        resizePhone();
    }, [isMobile]);

    const handleCategory = (_item, _index) => {
        if (currentIndex === _index) return;

        setCurrentIndex(_index);
        setCurrentPage(1);
        setMobileCoupons([]);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(_setPageSize);

    const [runOnlineQuery, onlineQueryResponse] = useLazyQuery(getCouponWallet, {
        fetchPolicy: 'network-only',
    });
    const [runOfflineQuery, offlineQueryResponse] = useLazyQuery(getOfflineVouchers, {
        fetchPolicy: 'network-only',
    });
    const [redeemOfflineVoucherMutation] = useMutation(redeemOfflineVoucher, {
        fetchPolicy: 'no-cache',
    });
    const isOffline = categoryList[currentIndex]?.code === 'OFFLINE';
    const activeQueryResponse = isOffline ? offlineQueryResponse : onlineQueryResponse;
    const { loading } = activeQueryResponse;
    const data = activeQueryResponse?.data;
    const couponList = isOffline
        ? data?.offlineVouchers || activeQueryResponse?.previousData?.offlineVouchers
        : data?.customerCoupons || activeQueryResponse?.previousData?.customerCoupons;
    const rawCoupons = couponList?.items || [];
    const responsePage = couponList?.currentPage;
    const totalPagesFromData = couponList?.totalCount ? Math.ceil(couponList.totalCount / _setPageSize) : 0;
    const totalCount = couponList?.totalCount;

    const pageControl = {
        currentPage,
        setPage: setCurrentPage,
        totalPages: totalPagesFromData,
    };

    useEffect(() => {
        setPageSize(_setPageSize);
        setCurrentPage(1);
        setMobileCoupons([]);
    }, [!!isMobile]);

    useEffect(() => {
        if (!isMobile) {
            return;
        }
        setMobileCoupons(prevCoupons => {
            if (responsePage === 1) {
                return rawCoupons;
            }

            if (!rawCoupons.length) {
                return prevCoupons;
            }

            const existingCodes = new Set(prevCoupons.map(item => item.code || item.id));
            const newCoupons = rawCoupons.filter(item => {
                const identifier = item.code || item.id;
                if (!identifier) {
                    return true;
                }
                return !existingCodes.has(identifier);
            });
            return [...prevCoupons, ...newCoupons];
        });
    }, [rawCoupons, isMobile, responsePage]);

    useEffect(() => {
        if (responsePage === currentPage) {
            isLoadingMore.current = false;
        }
    }, [currentPage, responsePage]);

    const coupons = isMobile ? mobileCoupons : rawCoupons;
    // 移动端是否展示没有更多数据
    const isMobileNoMoreData = !loading && isMobile && !!totalCount && coupons.length >= totalCount;
    const shouldShowPageLoading = loading && !isLoadingMore.current;

    useEffect(() => {
        const variables = {
            currentPage: Number(currentPage),
            pageSize,
        };

        if (isOffline) {
            runOfflineQuery({
                variables: {
                    ...variables,
                    filter: {
                        status: sortCurrent?.value || 'valid',
                    },
                },
            });
            return;
        }

        runOnlineQuery({
            variables: {
                ...variables,
                status: sortCurrent?.value || 'valid',
            },
        });
    }, [isOffline, pageSize, currentPage, runOfflineQuery, runOnlineQuery, sortCurrent]);

    const sendDataToPopUp = data => {
        // 线下优惠券
        if (isOffline) {
            if (data?.status === 'used') {
                setOpenOfflineDetailModal(true);
            } else {
                setOpenOfflineModal(true);
            }
        } else {
            setIsModalOpen(true);
        }
        setCouponData(data);
    };
    const loadMoreData = () => {
        if (loading || isLoadingMore.current || !isMobile || currentPage >= totalPagesFromData) return;
        isLoadingMore.current = true;
        setCurrentPage(prevPage => prevPage + 1);
    };

    const handleCloseOfflineDetail = () => {
        setOpenOfflineDetailModal(false);
    };
    const handleSortSelect = item => {
        setSortCurrent(item);
        setCurrentPage(1);
        setMobileCoupons([]);
    };
    const handleContinueOffline = async () => {
        try {
            const { data: redeemData } = await redeemOfflineVoucherMutation({
                variables: { uid: couponData?.uid },
            });

            if (!redeemData?.redeemOfflineVoucher) {
                throw new Error('Unable to redeem voucher.');
            }

            const shouldResetPage = currentPage > 1 && rawCoupons.length <= 1;
            const refreshPage = shouldResetPage ? 1 : currentPage;

            setOpenOfflineModal(false);
            setOpenOfflineDetailModal(true);
            setMobileCoupons(prevCoupons =>
                shouldResetPage ? [] : prevCoupons.filter(coupon => coupon.uid !== couponData?.uid),
            );
            setCurrentPage(refreshPage);

            if (isOffline && refreshPage === currentPage) {
                runOfflineQuery({
                    variables: {
                        currentPage: refreshPage,
                        pageSize,
                        filter: {
                            status: sortCurrent?.value || 'valid',
                        },
                    },
                    fetchPolicy: 'network-only',
                });
            }
        } catch (error) {
            addToast({
                type: 'error',
                message: error?.message || 'Unable to redeem voucher. Please try again.',
                dismissable: true,
                timeout: 7000,
            });
        }
    };
    const handleCloseOffline = () => {
        setOpenOfflineModal(false);
    };

    const copyCode = (couponCode, index, e) => {
        if (!isClick) return;
        e.stopPropagation();
        navigator.clipboard
            .writeText(couponCode)
            .then(() => {
                setCopiedIndex(index);
                setTimeout(() => setCopiedIndex(null), 1000);
            })
            .catch(err => console.log('coopon code error: ', err));
    };

    const handleScroll = () => {
        const lastUserLoaded = document.querySelector('.latest-cooupon-indicator');
        if (lastUserLoaded) {
            const lastUserLoadedOffset = lastUserLoaded.offsetTop + lastUserLoaded.clientHeight;
            const pageOffset = window.pageYOffset + window.innerHeight;
            if (pageOffset > lastUserLoadedOffset && isMobile) {
                loadMoreData();
            }
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });

    const content = useMemo(() => {
        if (totalPagesFromData) {
            return (
                <div>
                    <section className={isMobile ? classes.couponListMobile : classes.couponList}>
                        {coupons.map((coupon, index) => {
                            return (
                                <CouponCard
                                    key={coupon.code || index}
                                    coupon={coupon}
                                    index={index}
                                    isMobile={isMobile}
                                    isClaimed={coupon.is_claimed}
                                    showClaimButton={false}
                                    copyCode={copyCode}
                                    sendDataToPopUp={sendDataToPopUp}
                                    isClick={isClick}
                                    copiedIndex={copiedIndex}
                                    isDisabled={sortCurrent?.value === 'used'}
                                />
                            );
                        })}
                        {isMobileNoMoreData && <div className={classes.noMoreDataText}>That’s all your vouchers.</div>}
                    </section>
                    {!isMobile && (
                        <div className={classes.pagination}>
                            <Pagination pageControl={pageControl} />
                        </div>
                    )}
                    <div>
                        <PopUpWindow isOpen={!isMobile && isModalOpen} onClose={() => setIsModalOpen(false)}>
                            <CouponDetail coupon={couponData} />
                        </PopUpWindow>
                    </div>
                    {isMobile && isModalOpen && (
                        <CouponPopUpDetails
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            coupon={couponData}
                        />
                    )}
                </div>
            );
        } else {
            if (loading) return;
            return <CouponNoData />;
        }
    }, [classes.pagination, loading, coupons, pageControl, totalPagesFromData, sortCurrent]);

    return (
        <div className={`${classes.couponListContainer} fullPage`}>
            <div className={classes.couponListWrapper}>
                <OrderTabs
                    tabConfig={categoryList}
                    tabIndex={currentIndex}
                    changeTab={tabIndex => handleCategory(categoryList[tabIndex], tabIndex)}
                />
                <div className={classes.offlineCouponSortWrapper}>
                    <CouponFilter
                        titleStyle={{
                            color: '#000',
                            fontWeight: 700,
                        }}
                        activeSort={sortCurrent}
                        dataSource={_couponSortList}
                        onSortSelect={item => handleSortSelect(item)}
                    />
                </div>
                {shouldShowPageLoading ? <LoadingIndicator global={true} /> : content}
                <div className="latest-cooupon-indicator" />
                {isLoadingMore.current && loading && (
                    <div className={classes.loadingVoucherMore}>
                        <LoadingMoreIcon />
                        <span className={classes.loadingVoucherText}>Loading more</span>
                    </div>
                )}
                <RedeemCouponModal
                    isOpen={openOfflineModal}
                    onContinue={handleContinueOffline}
                    onClose={handleCloseOffline}
                />
                <OfflineCouponDetail
                    isOpen={openOfflineDetailModal}
                    detailUid={couponData?.uid}
                    onClose={handleCloseOfflineDetail}
                />
            </div>
        </div>
    );
};

export default MyCouponList;
