import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import Pagination from '@magento/venia-ui/lib/components/Pagination';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './coupon.module.css';
import { useHistory } from 'react-router-dom';
import DEFAULT_OPERATIONS from './couponPage.gql';
import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import CouponCard from '../MyCoupon/components/couponCard';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import { formatDateRange } from "../../../../overrides/venia-ui/util/timeValidForm";
import PopUpWindow from '../../../../overrides/venia-ui/components/PopUpWindow/popUpWindow';
import CouponPopUpDetails from '../../../../overrides/pagebuilder/ContentTypes/CouponCampaign/components/couponPopUpDetails/couponPopDetails';
import CouponDetail from '../../../../overrides/pagebuilder/ContentTypes/CouponCampaign/components/couponDeatial/coupouDeatial';
import { useToasts } from '@magento/peregrine/lib/Toasts';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { Check, AlertCircle } from 'react-feather';

const CheckIcon = <Icon size={20} src={Check} />;
const ErrorIcon = <Icon size={20} src={AlertCircle} />;
const _setPageSize = 9;

const CouponPage = props => {
    const operations = mergeOperations(DEFAULT_OPERATIONS);
    const { getCoupons, collectCouPon } = operations;
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const [, { addToast }] = useToasts();
    const [isMobile, setIsPhone] = useState(window.innerWidth < 767);

    const [fetchCollectCouponWallet] = useMutation(collectCouPon, {
        fetchPolicy: 'no-cache'
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [couponData, setCouponData] = useState({});
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [isClick, setIsClick] = useState(true);
    const [mobileCoupons, setMobileCoupons] = useState([]);


    const { setNavConfig } = useContext(HeaderContext);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'Vouchers',
            useCart: false
        });
    }, []);

    const resizePhone = () => {
        window.onresize = function () {
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

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(_setPageSize);

    const [runQuery, queryResponse] = useLazyQuery(getCoupons, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const { called, loading, error, refetch } = queryResponse;
    const data = queryResponse?.data;
    // 翻页（上拉加载）时 Apollo 对新 variables 会把 data 短暂置回
    // undefined，直接依赖会让整个列表瞬间卸载、页面塌缩、滚动条回顶；
    // 保底沿用上一次成功返回的 data，加载状态只交给底部 LOADING 文案。
    const lastDataRef = useRef(null);
    if (data) {
        lastDataRef.current = data;
    }
    const effectiveData = data || lastDataRef.current;
    const rawCoupons = effectiveData?.coupons?.items || [];
    const totalPagesFromData = effectiveData?.coupons?.totalCount
        ? Math.ceil(effectiveData?.coupons?.totalCount / _setPageSize)
        : 0;
    const totalCount = effectiveData?.coupons?.totalCount;

    const pageControl = {
        currentPage,
        setPage: setCurrentPage,
        totalPages: totalPagesFromData
    };

    useEffect(() => {
        setPageSize(_setPageSize);
        setCurrentPage(1);
        setMobileCoupons([]);
    }, [!!isMobile]);

    useEffect(() => {
        if (!isMobile || !rawCoupons.length) {
            return;
        }
        setMobileCoupons(prevCoupons => {
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
    }, [rawCoupons, isMobile]);

    const coupons = isMobile ? mobileCoupons : rawCoupons;

    useEffect(() => {
        runQuery({
            variables: {
                currentPage: Number(currentPage),
                pageSize,
            }
        });
    }, [runQuery, currentPage, pageSize]);

    const linkToSignInPage = () => {
        history.push('/sign-in');
    };

    const sendDataToPopUp = (data) => {
        setIsModalOpen(true);
        setCouponData(data);
    };
    const loadMoreData = () => {
        if (loading || !isMobile) return;
        console.log('加载下一页～');
        setCurrentPage(prevPage => prevPage + 1);
    };

    const claimCoupon = async (code, e) => {
        if (!isClick) return;
        e.stopPropagation();
        try {
            const { data } = await fetchCollectCouponWallet({
                variables: { couponCode: code }
            });
            if (data) {

                addToast({
                    type: 'success',
                    icon: CheckIcon,
                    message: 'The coupon has already been claimed!',
                    dismissable: true,
                    timeout: 7000
                });
                if (isMobile) {
                    setMobileCoupons([]);
                    setCurrentPage(1);
                }
                refetch();
            }
        } catch (error) {
            // linkToSignInPage();

            addToast({
                type: 'error',
                icon: ErrorIcon,
                message: 'Sorry, the operation failed, please try again!',
                dismissable: true,
                timeout: 7000
            });
        }
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
            .catch((err) => console.log('coopon code error: ', err));
    };

    const handleScroll = () => {
        const lastUserLoaded = document.querySelector(
            '.latest-cooupon-indicator'
        );
        if (lastUserLoaded) {
            const lastUserLoadedOffset =
                lastUserLoaded.offsetTop + lastUserLoaded.clientHeight;
            const pageOffset = window.pageYOffset + window.innerHeight;
            if (
                pageOffset > lastUserLoadedOffset &&
                !!loadMoreData &&
                coupons?.length < totalCount &&
                isMobile
            ) {
                loadMoreData();
            }
        }
    };

    const handleNavigate = (path) => {
        history.push(path);
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
                    {!isMobile && (<div className={classes.headerBtn}>
                        <div className={classes.buttonContainer}>
                            <button
                                className={classes.actionButton}
                                onClick={() => handleNavigate('/myCouponList')}
                            >
                                Go To My Vouchers
                            </button>
                        </div>
                    </div>)}
                    <section className={isMobile ? classes.couponListMobile : classes.couponList}>
                        {coupons.map((coupon, index) => {
                            return (
                                <CouponCard
                                    key={coupon.code || index}
                                    coupon={coupon}
                                    index={index}
                                    isMobile={isMobile}
                                    isClaimed={coupon.is_claimed || coupon.status === 'used'}
                                    copyCode={copyCode}
                                    claimCoupon={claimCoupon}
                                    sendDataToPopUp={sendDataToPopUp}
                                    isClick={isClick}
                                    copiedIndex={copiedIndex}
                                    formatDateRange={formatDateRange}
                                />
                            );
                        })}
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
                    {(isMobile && isModalOpen) && (
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
            return (
                <div className={classes.noData}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="82"
                        height="60"
                        viewBox="0 0 82 60"
                        fill="none"
                    >
                        <path
                            opacity="0.7"
                            d="M81.1522 22.8341L74.825 14.7647C74.3166 14.1192 73.7196 13.5511 73.0603 13.0734H73.0636H73.057C72.3092 12.5343 71.4826 12.105 70.5937 11.8178L45.9899 4.52946C44.1859 3.942 42.2375 3.942 40.4302 4.52946L14.557 11.8145C13.6616 12.105 12.8252 12.5375 12.0773 13.083H12.0708H12.074C11.418 13.5607 10.8276 14.1224 10.3258 14.7647L3.99852 22.8341C3.31954 23.7024 3.69347 24.9677 4.74309 25.3389L11.9855 27.9049V47.9074C11.9855 48.8822 12.6218 49.7472 13.5599 50.0539L39.7972 58.5945C41.6045 59.182 43.5528 59.182 45.3601 58.5945L71.6007 50.0539C72.5421 49.7472 73.1751 48.8822 73.1751 47.9074V27.9049L80.4142 25.3421C81.4606 24.9709 81.8378 23.7056 81.1588 22.8373L81.1522 22.8341Z"
                            fill="#FFC080"
                        />
                        <path
                            d="M69.6515 24.752V44.6799C69.6515 45.6511 69.0283 46.5129 68.1068 46.8179L42.3815 55.3267C40.6114 55.9134 38.6988 55.9134 36.9288 55.3267L11.2068 46.8179C10.2853 46.5129 9.66211 45.6511 9.66211 44.6799V24.752"
                            stroke="#424242"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M39.6572 19.0498V55.7634"
                            stroke="#424242"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M47.3075 3.05859L67.1228 8.7201C68.7669 9.26371 70.2121 10.2879 71.2728 11.6602L77.4746 19.6984C78.1409 20.5635 77.7729 21.8231 76.7454 22.1943L51.0299 31.449C50.1018 31.7838 49.0677 31.4755 48.4743 30.6899L39.6572 19.0454"
                            stroke="#424242"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M15.1077 26.7102L2.56491 22.1956C1.53736 21.8277 1.16942 20.5648 1.83568 19.6996L8.03748 11.6615C9.09486 10.2892 10.5401 9.26496 12.1875 8.72135L37.5283 1.92622C39.8519 1.31632 41.3502 1.38592 43.392 1.97594"
                            stroke="#424242"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M39.6566 19.0498L30.8395 30.6943C30.2462 31.4799 29.2087 31.7882 28.2839 31.4534L19.5762 28.3177"
                            stroke="#424242"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M9.74805 9.98689L37.028 18.6416C38.7384 19.1852 40.5747 19.1852 42.2851 18.6416L69.5485 9.97363"
                            stroke="#424242"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                    <div className={classes.noDataText}>
                        No coupon at the monent
                    </div>
                </div>
            );
        }
    }, [
        classes.pagination,
        loading,
        coupons,
        pageControl,
        totalPagesFromData,
    ]);

    const header = useMemo(() => {
        return (
            <div className={classes.headerContainer}>
                {/* 面包屑导航 */}
                <div className={classes.breadcrumb}>
                    <span
                        className={classes.breadcrumbLink}
                        onClick={() => handleNavigate('/')}
                    >
                        HomePage
                    </span>
                    <span className={classes.breadcrumbSeparator}> &gt; </span>
                    <span className={classes.breadcrumbCurrent}>Voucher list</span>
                </div>
            </div>
        );
    }, []);

    return (
        <div className={!isMobile ? classes.couponPage : ''}>
            <div>
                {!isMobile && header}
                {content}
                <div className="latest-cooupon-indicator" />
                <p
                    className={
                        loading && isMobile ? classes.loadingText : classes.hideLoadingText
                    }
                >
                    LOADING
                </p>
                {isMobile && (
                    <>
                        <div style={{ paddingTop: '60px' }}>
                            {/* 占位符 */}
                        </div>
                        <div className={classes.myCouponBtnContainer}>
                            <button
                                className={classes.myCouponBtn}
                                onClick={() => handleNavigate('/myCouponList')}
                            >
                                Go To My Vouchers
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CouponPage;

