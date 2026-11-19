import React, { useEffect, useMemo, useState, useContext } from 'react';
import Pagination from '@magento/venia-ui/lib/components/Pagination';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './index.module.css';
import { useHistory } from 'react-router-dom';
import { useLazyQuery, useQuery, gql } from '@apollo/client';
import PointsPop from './PointsPop';
import { HeaderContext } from '../../../../../peregrine/context/header';
import InfoPop from '../AccountInfo/InfoPop';

const _setPageSize = 20;

const GET_POINT_RECORDS = gql`
    query GetPointRecords($input: PointRecordsInput) {
        getPointRecords(input: $input) {
            success
            code
            message
            data {
                page
                pageSize
                totalCount
                totalPage
                items {
                    date
                    signedPoint
                    transactionNumber
                    channelType
                    storeName
                    earnedFrom
                    status,
                    recordType
                }
            }
        }
    }
`;

const GET_POINT_BALANCE = gql`
    query GetPointBalance {
        getBalancePoint {
            success
            code
            message
            data {
                point
            }
        }
        getExpiringPoints {
            success
            code
            message
            data {
                expiringPoint
                expiringTime
            }
        }
    }
`;

function formatDate(timestamp) {
  const date = new Date(timestamp);

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatDateTime(timestamp) {
    if (!timestamp) return '';
    let dateInput = timestamp;
    if (typeof timestamp === 'string' && !timestamp.includes('T')) {
        dateInput = timestamp.replace(/-/g, '/');
    }
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) return timestamp;

    const day = date.getDate();
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

const formatPoints = (value, flag = false) => {
    const stringValue = String(value != null ? value : '');
    const isNegative = stringValue.trim().startsWith('-');
    const raw = stringValue.replace(/[^0-9]/g, '');
    if (raw === '') return '0';
    const formatted = Number(raw).toLocaleString();
    return isNegative ? `-${formatted}` : flag ? `+${formatted}` : formatted;
};

const MyPoints = props => {
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const { setNavConfig } = useContext(HeaderContext);
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);
    const [isInfoPop, setIsInfoPop] = useState(false);

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

    useEffect(() => {
        setNavConfig({
            headerTitle: 'Point History'
        });
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(_setPageSize);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [runQuery, queryResponse] = useLazyQuery(GET_POINT_RECORDS, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const { called, loading, error } = queryResponse;
    const totalPagesFromData =
        queryResponse?.data?.getPointRecords?.data?.totalPage;
    const totalCount = queryResponse?.data?.getPointRecords?.data?.totalCount;
    const items = queryResponse?.data?.getPointRecords?.data?.items || [];

    const { data: pointData } = useQuery(GET_POINT_BALANCE, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const balancePoint = pointData?.getBalancePoint?.data?.point || 0;
    const expiringPoint =
        pointData?.getExpiringPoints?.data?.expiringPoint || 0;
    const expiringTime = formatDate(
        pointData?.getExpiringPoints?.data?.expiringTime
    );

    const categoryList = [
        {
            name: 'All',
            status: "",
            recordType: ""
        },
        {
            name: 'Earned',
            status: 'VALID',
            recordType: 'SEND'
        },
        {
            name: 'Redeemed',
            status: 'USED',
            recordType: 'DEDUCT'
        },
        {
            name: 'Expired',
            status: 'EXPIRE',
            recordType: ""
        }
    ];
    const status = categoryList[currentIndex]?.status || '';

    const pageControl = {
        currentPage,
        setPage: setCurrentPage,
        totalPages: totalPagesFromData
    };

    useEffect(() => {
        setPageSize(_setPageSize);
    }, [!!isPhone]);

    useEffect(() => {
        runQuery({
            variables: {
                input: {
                    page: Number(currentPage) - 1,
                    pageSize: 20 || pageSize,
                    status: status || undefined,
                    recordType: categoryList[currentIndex]?.recordType || undefined
                }
            }
        });
    }, [runQuery, currentPage, pageSize, status]);

    const loadMoreData = () => {
        if (loading) return;
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
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const getStatusColor = (status, recordType, isExpire, isReverseSend) => {
        if(isExpire){
            return '#CC2B1E';
        }
        if(isReverseSend) {
            return '#46A147';
        }
        if(recordType === 'REVERSE_SEND') {
            return '#CC2B1E';
        }
        switch (status) {
            case 'VALID':
                return '#46A147';
            case 'USED':
                return '#CC2B1E';
            case 'EXPIRE':
                return '#9E9E9E';
            default:
                return '';
        }
    };

    const getShowText = (status, recordType) => {
        if(currentIndex == 0 && recordType == 'REVERSE_DEDUCT') { // 退给客户
            return 'Return'
        }
        if(currentIndex == 0 && recordType == 'REVERSE_SEND') { // 退给系统
            return 'Refund'
        }
        if(status == 'VALID') {
            return 'Earned'
        }
        if(status == 'EXPIRE') {
            return 'Expired'
        }
        if(status == 'USED') {
            return 'Redeemed'
        }
        return ''
    }

    const content = useMemo(() => {
        if (totalPagesFromData) {
            return (
                <div>
                    <div className={classes.contentWrap}>
                        {items.map(item => {
                            return (
                                <div
                                    className={`${classes.wrap} ${
                                        item?.is_read == 0 ? '' : ''
                                    }`}
                                    key={item?.entity_id}
                                >
                                    <div
                                        className={classes.time}
                                    >
                                        <div>
                                            {formatDateTime(item?.date)}
                                            {item?.status && (
                                                <>
                                                    <span
                                                        className={classes.channelType}
                                                    >
                                                        |
                                                    </span>
                                                    <span
                                                        style={{
                                                            color: getStatusColor(item?.status, item?.recordType, ''),
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {getShowText(item?.status, item?.recordType)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                fontSize: 16
                                            }}
                                        >
                                            <span className={`${classes.num} ${String(item?.signedPoint)?.length > 6 ? classes.numOver : ''}`} style={{ color: getStatusColor(item?.status, item?.recordType, item?.status === 'EXPIRE', item?.recordType == 'REVERSE_SEND') }}>
                                                {formatPoints(item?.signedPoint, true)}
                                            </span>
                                            <span>Points</span>
                                        </div>
                                    </div>
                                    {
                                        item?.status !== 'EXPIRE' && <div className={classes.info}>
                                            {item?.transactionNumber && item?.status !== 'EXPIRE' && <div>
                                                <span>Order Number</span>
                                                <span title={item?.transactionNumber} style={{ fontWeight: 500, width: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                                                    {item?.transactionNumber}
                                                </span>
                                            </div>}
                                            {item?.earnedFrom && item?.status !== 'EXPIRE' && <div>
                                                <span>Channel</span>
                                                <span style={{ fontWeight: 500 }}>
                                                    {item?.earnedFrom}
                                                </span>
                                            </div>}
                                            {/* {item?.storeName && <div>
                                                <span>Store name</span>
                                                <span style={{ fontWeight: 500 }}>
                                                    {item?.storeName}
                                                </span>
                                            </div>} */}
                                        </div>
                                    }
                                </div>
                            );
                        })}
                    </div>
                    {!isPhone && (
                        <div className={classes.pagination}>
                            <Pagination pageControl={pageControl} />
                        </div>
                    )}
                    <div className={classes.remark}>Only shows last 6 months receipt records</div>
                </div>
            );
        } else {
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
                    <div className={classes.noDataText}>No data</div>
                </div>
            );
        }
    }, [classes.pagination, loading, items, pageControl, totalPagesFromData]);

    const handleCategory = (_item, _index) => {
        setCurrentPage(1);
        setCurrentIndex(_index);
    };

    const navCategory = useMemo(() => {
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
                            {item.name}
                        </div>
                    );
                })}
                <div className={classes.line} />
            </div>
        );
    }, [currentIndex]);

    const Details = () => {
        return (
            <div className={classes.wrap}>
                <div className={classes.details}>
                    <div className={classes.detailsTop}>
                        <div className={classes.detailsTopImg}>111</div>
                        <div>
                            <div style={{ fontSize: 20 }}>Diskon Rp250 RB</div>
                            <div style={{ fontSize: 18 }}>
                                Buy La Roche-Posay Cicaplast B5 Ultra Repair
                                Serum 30mlBuy La Roche-Posay Cicaplast B5 Ultra
                                Repair Serum 30ml
                            </div>
                            <div
                                style={{
                                    display: flex,
                                    color: '#666',
                                    fontSize: '14px'
                                }}
                            >
                                <span>Produk Terbaru</span>
                                <div>
                                    <span>Valid date: </span>
                                    <span>10.05.2023 - 31.07.2023</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={classes.pointWrap}>
            <div className={classes.title}>Point History</div>
            <div className={classes.statistics}>
                <div className={classes.statisticsNum} id="needAddPoint">
                    <span style={{ margin: '0 2px' }}>{formatPoints(balancePoint)}</span>
                    <img
                        src={
                            '/venia-static-assets/images/gim.png'
                        }
                    />
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setIsInfoPop(true);
                        }}
                    >
                        <path
                            d="M16 6.25C12.4844 6.25 9.29688 8.125 7.51562 11.125C5.78125 14.1719 5.78125 17.875 7.51562 20.875C9.29688 23.9219 12.4844 25.75 16 25.75C19.4688 25.75 22.6562 23.9219 24.4375 20.875C26.1719 17.875 26.1719 14.1719 24.4375 11.125C22.6562 8.125 19.4688 6.25 16 6.25ZM16 28C11.6875 28 7.75 25.75 5.59375 22C3.4375 18.2969 3.4375 13.75 5.59375 10C7.75 6.29688 11.6875 4 16 4C20.2656 4 24.2031 6.29688 26.3594 10C28.5156 13.75 28.5156 18.2969 26.3594 22C24.2031 25.75 20.2656 28 16 28ZM14.125 19.75H15.25V16.75H14.125C13.4688 16.75 13 16.2812 13 15.625C13 15.0156 13.4688 14.5 14.125 14.5H16.375C16.9844 14.5 17.5 15.0156 17.5 15.625V19.75H17.875C18.4844 19.75 19 20.2656 19 20.875C19 21.5312 18.4844 22 17.875 22H14.125C13.4688 22 13 21.5312 13 20.875C13 20.2656 13.4688 19.75 14.125 19.75ZM16 13C15.1562 13 14.5 12.3438 14.5 11.5C14.5 10.7031 15.1562 10 16 10C16.7969 10 17.5 10.7031 17.5 11.5C17.5 12.3438 16.7969 13 16 13Z"
                            fill="black"
                        />
                    </svg>
                </div>
                { !!expiringPoint && <div>{formatPoints(expiringPoint)} points will expire by {expiringTime}</div>}
            </div>
            {navCategory}
            {content}
            <div className="latest-notifition-indicator" />
            {/* {false && <Details />} */}
            {isInfoPop && (
                <InfoPop
                    cms="pwa-guardian"
                    onClose={() => setIsInfoPop(false)}
                />
            )}
        </div>
    );
};

export default MyPoints;
