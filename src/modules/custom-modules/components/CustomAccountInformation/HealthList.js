import React, { useEffect, useMemo, useState, useContext } from 'react';
import Pagination from '@magento/venia-ui/lib/components/Pagination';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './notifition.module.css';
import { useHistory } from 'react-router-dom';
import { GET_HEALTHCHECKS } from './health.gpl';
import { useLazyQuery, useQuery } from '@apollo/client';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';

const _setPageSize = 12;

const NotifitionInfo = props => {
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

    const { setNavConfig } = useContext(HeaderContext);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'Laporan Kesahatan',
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

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(_setPageSize);

    const [runQuery, queryResponse] = useLazyQuery(GET_HEALTHCHECKS, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const { called, loading, error } = queryResponse;
    const data = queryResponse?.data;
    const items = data?.getHealthChecks?.healthchecks || [];
    const totalPagesFromData = data?.getHealthChecks?.total_pages;
    const totalCount = data?.getHealthChecks?.total_count;

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
                currentPage: Number(currentPage),
                pageSize
            }
        });
    }, [runQuery, currentPage, pageSize]);

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

    const toUrl = _item => {
        history.push(`/health-detail/${_item?.entity_id}`);
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
                                        item?.is_read == 0
                                            ? classes.notifitionNew
                                            : ''
                                    }`}
                                    key={item?.entity_id}
                                >
                                    {
                                        <span
                                            style={{
                                                opacity: item?.is_read == 0 ? 1 : 0
                                            }}
                                            className={classes.newFlag}
                                        />
                                    }
                                    <div
                                        className={classes.imgWrap}
                                        style={{ backgroundColor: '#FFEEE4'}}
                                        onClick={() => {
                                            toUrl(item);
                                        }}
                                    >
                                        <svg
                                            width="27"
                                            height="36"
                                            viewBox="0 0 27 36"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M3.375 31.5C3.375 32.1328 3.86719 32.625 4.5 32.625H22.5C23.0625 32.625 23.625 32.1328 23.625 31.5V11.25H18C16.7344 11.25 15.75 10.2656 15.75 9V3.375H4.5C3.86719 3.375 3.375 3.9375 3.375 4.5V31.5ZM4.5 0H16.1016C17.2969 0 18.4219 0.492188 19.2656 1.33594L25.6641 7.73438C26.5078 8.57812 27 9.70312 27 10.8984V31.5C27 34.0312 24.9609 36 22.5 36H4.5C1.96875 36 0 34.0312 0 31.5V4.5C0 2.03906 1.96875 0 4.5 0ZM15.1875 19.6875V28.6875C15.1875 29.6719 14.4141 30.375 13.5 30.375C12.5156 30.375 11.8125 29.6719 11.8125 28.6875V19.6875C11.8125 18.7734 12.5156 18 13.5 18C14.4141 18 15.1875 18.7734 15.1875 19.6875ZM21.375 21.9375V28.6875C21.375 29.6719 20.6016 30.375 19.6875 30.375C18.7031 30.375 18 29.6719 18 28.6875V21.9375C18 21.0234 18.7031 20.25 19.6875 20.25C20.6016 20.25 21.375 21.0234 21.375 21.9375ZM9 24.1875V28.6875C9 29.6719 8.22656 30.375 7.3125 30.375C6.32812 30.375 5.625 29.6719 5.625 28.6875V24.1875C5.625 23.2734 6.32812 22.5 7.3125 22.5C8.22656 22.5 9 23.2734 9 24.1875Z"
                                                fill="#FF8200"
                                            />
                                        </svg>
                                    </div>
                                    <div className={classes.notifitionContent}>
                                        <div className={classes.title}>
                                            {item?.title}
                                        </div>
                                        <div className={classes.contentText} style={{ fontSize: 14 }}>
                                            Kegiatan: {item?.activity}
                                        </div>
                                        <div className={classes.contentText} style={{ fontSize: 14}}>
                                            Jenis Pemeriksaan: {item?.check_type}
                                        </div>
                                        <div className={classes.time}>
                                            {item?.check_date}
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
                        No data
                    </div>
                </div>
            );
        }
    }, [classes.pagination, loading, items, pageControl, totalPagesFromData]);

    return (
        <div>
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
