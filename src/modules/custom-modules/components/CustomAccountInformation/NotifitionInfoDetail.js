import React, { useState, useEffect, useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './notifitionDetail.module.css';
import { VIEW_NOTIFITION } from './notifition.gpl';
import { useQuery } from '@apollo/client';
import { useParams, Link, useHistory } from 'react-router-dom';
import Image from '@magento/venia-ui/lib/components/Image';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';

const NotifitionInfoDetail = props => {
    const { publishId } = useParams();
    const history = useHistory();
    const classes = useStyle(defaultClasses);
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

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

    const navList = [
        {
            path: '',
            label: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Homepage</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        style={{ margin: 4 }}
                    >
                        <path
                            d="M9.7775 6.4675L5.7775 2.4675C5.4875 2.1775 5.0075 2.1775 4.7175 2.4675C4.4275 2.7575 4.4275 3.2375 4.7175 3.5275L8.1875 6.9975L4.7175 10.4675C4.4275 10.7575 4.4275 11.2375 4.7175 11.5275C4.8675 11.6775 5.0575 11.7475 5.2475 11.7475C5.4375 11.7475 5.6275 11.6775 5.7775 11.5275L9.7775 7.5275C10.0675 7.2375 10.0675 6.7575 9.7775 6.4675Z"
                            fill="#969696"
                        />
                    </svg>
                </div>
            )
        },
        {
            path: '',
            label: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                        onClick={() => {
                            history.goBack();
                        }}
                    >
                        Account
                    </span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        style={{ margin: 4 }}
                    >
                        <path
                            d="M9.7775 6.4675L5.7775 2.4675C5.4875 2.1775 5.0075 2.1775 4.7175 2.4675C4.4275 2.7575 4.4275 3.2375 4.7175 3.5275L8.1875 6.9975L4.7175 10.4675C4.4275 10.7575 4.4275 11.2375 4.7175 11.5275C4.8675 11.6775 5.0575 11.7475 5.2475 11.7475C5.4375 11.7475 5.6275 11.6775 5.7775 11.5275L9.7775 7.5275C10.0675 7.2375 10.0675 6.7575 9.7775 6.4675Z"
                            fill="#969696"
                        />
                    </svg>
                </div>
            )
        },
        {
            path: '',
            label: (
                <div className={classes.linkItem}>
                    <span
                        onClick={() => {
                            history.goBack();
                        }}
                    >
                        Notification
                    </span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        style={{ margin: 4 }}
                    >
                        <path
                            d="M9.7775 6.4675L5.7775 2.4675C5.4875 2.1775 5.0075 2.1775 4.7175 2.4675C4.4275 2.7575 4.4275 3.2375 4.7175 3.5275L8.1875 6.9975L4.7175 10.4675C4.4275 10.7575 4.4275 11.2375 4.7175 11.5275C4.8675 11.6775 5.0575 11.7475 5.2475 11.7475C5.4375 11.7475 5.6275 11.6775 5.7775 11.5275L9.7775 7.5275C10.0675 7.2375 10.0675 6.7575 9.7775 6.4675Z"
                            fill="#969696"
                        />
                    </svg>
                </div>
            )
        },
        {
            path: '',
            label: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Notification Detail</span>
                </div>
            ),
            isCurrent: true
        }
    ];
    const { data } = useQuery(VIEW_NOTIFITION, {
        variables: { publishId: Number(publishId) },
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    return (
        <div style={{ padding: 15 }}>
            {!isPhone && (
                <div style={{ display: 'flex' }}>
                    {navList.map(item => {
                        return (
                            <div
                                onClick={e => {
                                    if(item?.isCurrent) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                    history.push({
                                        pathname: '/my-account-information',
                                        state: { tabId: 'notification' }
                                    });
                                }}
                                className={`${classes.link} ${
                                    item?.isCurrent ? classes.current : ''
                                }`}
                            >
                                {item.label}
                            </div>
                        );
                    })}
                </div>
            )}
            {/* <div
                className={classes.banner}
                style={{
                    backgroundImage: `url(${data?.viewNotification?.image})`
                }}
            >
                <Image width={'100%'} src={data?.viewNotification?.image}></Image>
            </div> */}
            <img
                width={'100%'}
                style={{ width: '100%', maxHeight: 200, borderRadius: 8, margin: '15px 0' }}
                src={`/media/${data?.viewNotification?.image}`}
            />
            <div className={classes.title}>{data?.viewNotification?.title}</div>
            <div className={classes.time}>
                {data?.viewNotification?.start_date}
            </div>
            <div className={classes.content}>
                {data?.viewNotification?.description}
            </div>
        </div>
    );
};

export default NotifitionInfoDetail;
