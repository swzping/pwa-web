import React, { useEffect, useMemo, useState, useContext } from 'react';
import Pagination from '@magento/venia-ui/lib/components/Pagination';
import { GET_PAGE_SIZE } from '@magento/venia-ui/lib/RootComponents/Category/category.gql';
import Image from '@magento/venia-ui/lib/components/Image';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './notifition.module.css';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { useHistory } from 'react-router-dom';
import { useCategory } from '@magento/peregrine/lib/talons/RootComponents/Category';
import { useCategoryContent } from '@magento/peregrine/lib/talons/RootComponents/Category';
import { GET_NOTIFITION_LIST, GET_NOTIFITION_CATEGORY, VIEW_NOTIFITION } from './notifition.gpl';
import { useLazyQuery, useQuery } from '@apollo/client';
import { emitRefreshNotification } from '@/helpers/hooks';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';

let testNotifications = [
    {
        is_read: false,
        title: 'hello1',
        description: 'aaaawwe',
        created_at: '2024-08-15 07:57:57'
    },
    {
        is_read: true,
        title: 'hello2',
        description: 'aaaawwe',
        created_at: '2024-08-15 07:57:57'
    },
    {
        is_read: false,
        title: 'hello3',
        description: 'aaaawwe',
        created_at: '2024-08-15 07:57:57'
    }
];

const _setPageSize = 12;

const NotifitionInfo = props => {
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);
    const { data: notifitionCategoryData } = useQuery(GET_NOTIFITION_CATEGORY, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const categoryList = notifitionCategoryData?.getNotificationCategory || [];
    const [currentCategory, setCurrentCategory] = useState('all');

    const { setNavConfig } = useContext(HeaderContext);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'Notification',
            useCart: false
        });
    }, []);

    const resizePhone = () => {
        window.onresize = function() {
            const width = window.innerWidth;
            const newIsPhone = width < 767;
            if (isPhone !== newIsPhone) {
                setIsPhone(newIsPhone);
            }
        };
    };

    useEffect(() => {
        resizePhone();
    }, [isPhone]);

    const handleCategory = (_item, _index) => {
        setCurrentCategory(_item?.code);
        setCurrentIndex(_index);
        // 通知 Header 刷新通知数量
        emitRefreshNotification();
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(_setPageSize);

    const [runQuery, queryResponse] = useLazyQuery(GET_NOTIFITION_LIST, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'no-cache'
    });
    const [viewNotificationQuery] = useLazyQuery(VIEW_NOTIFITION);
    const { called, loading, error } = queryResponse;
    const data = queryResponse?.data;
    const items = data?.getNotifications?.notifications || [];
    const totalPagesFromData = data?.getNotifications?.total_pages;
    const totalCount = data?.getNotifications?.total_count;

    const pageControl = {
        currentPage,
        setPage: setCurrentPage,
        totalPages: totalPagesFromData
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [currentCategory]);

    useEffect(() => {
        setPageSize(_setPageSize);
    }, [!!isPhone]);

    useEffect(() => {
        runQuery({
            variables: {
                notificationType: currentCategory,
                currentPage: Number(currentPage),
                pageSize,
                notificationSortCode: 'created_at',
                notificationSortDirection: 'DESC'
            }
        });
    }, [runQuery, currentCategory, currentPage, pageSize]);

    const loadMoreData = () => {
        if (loading) return;
        // testNotifications = [...testNotifications, ...testNotifications];
        const _pageSize = pageSize + 1;
        setPageSize(_pageSize);
    };

    const handleScroll = () => {
        const lastUserLoaded = document.querySelector(
            '.latest-notifition-indicator'
        );
        if (lastUserLoaded) {
            const lastUserLoadedOffset =
                lastUserLoaded.offsetTop + lastUserLoaded.clientHeight;
            const pageOffset = window.pageYOffset + window.innerHeight;
            if (
                pageOffset > lastUserLoadedOffset &&
                !!loadMoreData &&
                items?.length < totalCount &&
                isPhone
            ) {
                loadMoreData();
            }
        }
    };

    useEffect(() => {
        localStorage.setItem('accountTab', 0)
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // const talonProps = useCategory({
    //     id: 'MjkxNA==',
    //     queries: {
    //         getPageSize: GET_PAGE_SIZE
    //     }
    // });
    // const {
    //     error,
    //     metaDescription,
    //     loading,
    //     categoryRelativePath,
    //     categoryData,
    //     pageControl,
    //     sortProps,
    //     layoutSwitcherProps,
    //     layoutSwitcherOptions,
    //     pageSize,
    //     isBackgroundLoading,
    //     loadMoreCategory,
    //     pageSizeCategory,
    //     isPhone,
    //     categoryNotFound
    // } = talonProps;

    // const talonProps1 = useCategoryContent({
    //     categoryId: 'MjkxNA==',
    //     data: categoryData,
    //     pageSize
    // });

    // const {
    //     categoryName,
    //     categoryDescription,
    //     filters,
    //     items,
    //     totalCount,
    //     totalPagesFromData
    // } = talonProps1;


    const toUrl = _item => {
        viewNotificationQuery({
            variables: {
                publishId: _item?.publish_id
            }
        })
        if(_item?.category_type == 'profile_completion') {
            history.push({
                pathname: '/my-account-information',
                state: { tabId: 'personalInfo' }
            });
        } else if(_item?.category_type == 'milestone_completion') {
            history.push(`/milestone`);
        } else if(_item?.category_type == 'abandoned_cart') {
            history.push(`/cart`);
        } else if(_item?.category_type == 'offline_order') {
            history.push(`/order-history`);
        } else if (_item?.target_type == 'notification_detail') {
            history.push(`/notifitionInfo-detail/${_item?.publish_id}`);
        } else {
            location.href = _item?.redirect_url
        }
    };

    const content = useMemo(() => {
        if (totalPagesFromData) {
            return (
                <div>
                    <section>
                        {items.map(item => {
                            return (
                                <div
                                    className={`${classes.notifition} ${
                                        !item?.is_read
                                            ? classes.notifitionNew
                                            : ''
                                    }`}
                                    key={item?.publish_id}
                                >
                                    {
                                        <span
                                            style={{
                                                opacity: item?.is_read ? 0 : 1
                                            }}
                                            className={classes.newFlag}
                                        />
                                    }
                                    <div
                                        className={classes.imgWrap}
                                        onClick={() => {
                                            toUrl(item);
                                        }}
                                    >
                                        {!item?.icon ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="50"
                                                height="36"
                                                viewBox="0 0 50 36"
                                                fill="none"
                                            >
                                                <g clip-path="url(#clip0_5015_6322)">
                                                    <path
                                                        fill-rule="evenodd"
                                                        clip-rule="evenodd"
                                                        d="M44.3207 0.00327281C44.8712 -0.0493295 45.341 0.55414 45.0287 1.08446C44.9476 1.22217 44.7961 1.3375 44.659 1.46019C43.2375 2.73192 41.7532 4.01408 40.3397 5.27884C39.9634 5.61554 39.5535 5.96911 39.1595 6.32169C39.0256 6.44154 38.8934 6.58163 38.7583 6.65908C38.1298 7.01924 37.3984 6.367 37.704 5.72358C37.7858 5.55144 37.9451 5.41847 38.0974 5.28651C39.9903 3.6464 41.7597 2.04825 43.6283 0.39434C43.834 0.212225 43.986 0.0352483 44.3207 0.00327281ZM28.0426 0.309992C27.7624 0.434136 27.5292 0.599228 27.3503 0.77007C26.9449 1.15715 26.6452 1.617 26.5557 2.27299C26.5066 2.63209 26.562 2.96388 26.6186 3.3005C26.674 3.63023 26.7238 3.96539 26.7759 4.282C27.3168 7.56282 27.8474 10.9155 28.3652 14.1124C28.945 17.692 29.5174 21.3038 30.1118 24.9089C30.1663 25.2397 30.2089 25.5752 30.2849 25.8827C30.4313 26.4749 30.7577 26.9404 31.1897 27.2783C31.6207 27.6154 32.2206 27.8683 32.952 27.8227C33.6593 27.7785 34.1755 27.5179 34.5885 27.1479C34.9877 26.7902 35.3024 26.2827 35.391 25.6527C35.4394 25.3073 35.3833 24.9635 35.328 24.6251C34.7383 21.0167 34.1548 17.3703 33.5735 13.821C32.9704 10.1378 32.4158 6.65325 31.8191 3.03212C31.7643 2.69995 31.7343 2.36141 31.6617 2.04295C31.5287 1.45973 31.1847 0.974345 30.7648 0.639715C30.3404 0.30148 29.6947 0.043683 28.9946 0.0876205C28.6504 0.109244 28.313 0.190218 28.0426 0.309992ZM19.1129 8.62975C16.8449 9.71461 14.347 10.5835 11.6859 11.2522C11.725 11.2576 11.789 11.2386 11.8039 11.2675C12.3922 14.9627 13.0045 18.6344 13.5977 22.3248C14.9684 22.2452 16.3983 22.2153 17.7676 22.2787C21.522 22.4528 24.8892 23.035 27.7437 24.073C28.0046 24.1679 28.258 24.2684 28.5147 24.3568C27.4475 17.8439 26.404 11.3079 25.3362 4.79576C23.5116 6.32245 21.4035 7.53407 19.1129 8.62975ZM36.5317 15.1475C36.7247 14.423 36.5196 13.6907 36.4137 13.0235C36.3567 12.6637 36.3179 12.3111 36.2485 11.9883C36.0403 11.0195 35.3545 10.3919 34.494 10.079C34.8267 12.2264 35.1909 14.4096 35.5404 16.5661C36.0061 16.2424 36.3672 15.7657 36.5317 15.1475ZM48.1207 10.5697C45.923 10.907 43.6547 11.2612 41.4647 11.5973C41.2942 11.6234 41.1075 11.6401 40.9691 11.6969C40.6742 11.818 40.4402 12.1105 40.5206 12.5097C40.5866 12.8375 40.8636 13.0904 41.2366 13.1002C41.3888 13.1042 41.5702 13.0588 41.748 13.0312C42.9846 12.8393 44.1465 12.6611 45.3592 12.4714C46.5708 12.2819 47.7638 12.1094 48.9783 11.9193C49.1573 11.8913 49.344 11.8762 49.4897 11.8273C49.7722 11.7324 50.0469 11.4435 49.9932 11.0452C49.9404 10.6539 49.6214 10.3778 49.1592 10.4164C48.8066 10.4458 48.4628 10.5172 48.1207 10.5697ZM7.2722 12.019C5.75423 12.2565 4.24271 12.4703 2.75621 12.7168C2.25874 12.7993 1.8479 12.9634 1.48953 13.1845C0.787033 13.6181 0.26195 14.2789 0.0654964 15.2012C0.0134917 15.4454 -0.0078295 15.7122 0.00255572 15.9833C0.0125475 16.2432 0.0665192 16.5005 0.104834 16.7348C0.271548 17.7555 0.423629 18.6853 0.584757 19.6716C0.665321 20.1645 0.718742 20.6618 0.820785 21.1439C1.01228 22.0482 1.54035 22.7341 2.23695 23.1682C2.57895 23.3814 3.0075 23.5616 3.50363 23.636C4.01479 23.7127 4.54947 23.6355 5.07715 23.544C5.73244 26.0236 6.3967 28.5163 7.05978 31.0049C7.39604 32.2669 7.70524 33.5165 8.04323 34.7469C8.21443 35.3701 8.57531 35.8026 9.20763 35.9584C9.56159 36.0457 9.91272 35.9816 10.2383 35.8971C10.8833 35.7298 11.5142 35.5786 12.158 35.414C12.4842 35.3306 12.8154 35.2674 13.11 35.1686C13.6888 34.9745 14.1127 34.5209 14.1721 33.8497C14.2039 33.4902 14.0934 33.1723 14.0069 32.8529C13.7544 31.9211 13.494 30.9751 13.2594 30.0541C12.6256 27.5655 11.9085 25.0591 11.2925 22.5855C11.5548 22.5395 11.8264 22.5026 12.1029 22.4704C11.5924 19.2861 11.0643 16.0691 10.5451 12.9008C10.4756 12.4765 10.4237 12.0268 10.3406 11.6126C10.337 11.595 10.3453 11.5453 10.3091 11.5436C9.32195 11.7209 8.29027 11.8597 7.2722 12.019ZM39.8047 19.0965C39.6604 19.7141 40.1986 19.9245 40.6072 20.101C42.8574 21.0731 45.061 22.0348 47.2867 23.0225C47.4571 23.0981 47.6217 23.1853 47.7824 23.2142C48.1778 23.2853 48.4862 23.0578 48.6006 22.8002C48.7541 22.4544 48.5991 22.0854 48.3567 21.9107C48.2373 21.8246 48.0588 21.7621 47.8925 21.6883C45.6408 20.6891 43.445 19.7392 41.2051 18.7591C40.9606 18.6521 40.7537 18.5103 40.4419 18.5444C40.0977 18.5821 39.8715 18.8103 39.8047 19.0965Z"
                                                        fill="#FF8300"
                                                    />
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_5015_6322">
                                                        <rect
                                                            width="50"
                                                            height="36"
                                                            fill="white"
                                                        />
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                        ) : (
                                            <img src={item?.icon} style={{ width: '100%'}} />
                                        )}
                                    </div>
                                    <div className={classes.notifitionContent}>
                                        <div className={classes.title}>
                                            {item?.title}
                                        </div>
                                        <div className={classes.contentText}>
                                            {item?.description}
                                        </div>
                                        <div className={classes.time}>
                                            {item?.created_at}
                                        </div>
                                    </div>
                                    <div
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            toUrl(item);
                                        }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="17"
                                            viewBox="0 0 16 17"
                                            fill="none"
                                        >
                                            <path
                                                d="M8.76758 2.8678L15.3916 9.49182L8.76758 16.1158L7.35352 14.7018L12.5635 9.49182L7.35352 4.28186L8.76758 2.8678Z"
                                                fill="#373036"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                    {!isPhone && (
                        <div className={classes.pagination}>
                            <Pagination pageControl={pageControl} />
                        </div>
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
                        No message at the monent
                    </div>
                </div>
            );
        }
    }, [
        classes.pagination,
        loading,
        items,
        pageControl,
        totalPagesFromData,
        currentCategory
    ]);

    const notificationCategory = useMemo(() => {
        return (
            <div className={classes.categoryNav}>
                {categoryList.map((item, index) => {
                    return (
                        <div
                            className={classes.categoryItem}
                            style={{
                                borderBottomColor:
                                    index == currentIndex ? '#FF8300' : '#fff',
                                zIndex: index == currentIndex ? 1 : 0
                            }}
                            onClick={() => {
                                handleCategory(item, index);
                            }}
                            key={index}
                        >
                            {item.label}
                        </div>
                    );
                })}
                <div className={classes.line} />
            </div>
        );
    }, [currentIndex]);

    return (
        <div>
            {notificationCategory}
            {content}
            <div className="latest-notifition-indicator" />
            <p
                className={
                    loading ? classes.loadingText : classes.hideLoadingText
                }
            >
                LOADING
            </p>
        </div>
    );
};

export default NotifitionInfo;
