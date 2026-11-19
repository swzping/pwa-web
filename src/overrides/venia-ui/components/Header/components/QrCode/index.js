import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './index.module.css';
import { useFiveMinuteCountdown } from '../../../../../venia-ui/components/ProductFullDetail/countDown/useCountdown';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery, gql } from '@apollo/client';
import { debounce } from 'lodash';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';

const GET_CUSTOMER_QR = gql`
    query GetCustomerQr {
        customer {
            qr_code {
                memberId
                expireTime
            }
        }
    }
`;

const FIVE_MINUTES_MS = 60000; // 60秒 = 1分钟
const PAD_ZERO = n => n.toString().padStart(2, '0');

const TITLE_STYLE = {
    color: '#FF8200',
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center'
};
const SUBTITLE_STYLE = {
    color: '#757575',
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'center'
};

const getTimeAfter5Minutes = () => {
    const date = new Date(Date.now() + FIVE_MINUTES_MS);
    return `${date.getFullYear()}-${date.getMonth() +
        1}-${date.getDate()} ${PAD_ZERO(date.getHours())}:${PAD_ZERO(
        date.getMinutes()
    )}:${PAD_ZERO(date.getSeconds())}`;
};

const QrCodePage = () => {
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const locationState = history.location.state;
    const [qrValue, setQrValue] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const initializedRef = useRef(false);
    const debouncedRefresh = useRef(
        debounce(callback => {
            callback();
        }, 800)
    );

    const { data, refetch } = useQuery(GET_CUSTOMER_QR, {
        fetchPolicy: 'cache-and-network'
    });
    const memberId =
        locationState?.memberId || data?.customer?.qr_code?.memberId;
    const expireTime = data?.customer?.qr_code?.expireTime;

    const { formatCountdown, isFinished, reset } = useFiveMinuteCountdown();

    const handleRefresh = useCallback((shouldRefetch = true) => {
        setRefreshing(true);

        debouncedRefresh.current(async () => {
            let nextExpireTime = expireTime;

            if (shouldRefetch) {
                try {
                    const result = await refetch();
                    nextExpireTime =
                        result?.data?.customer?.qr_code?.expireTime ||
                        expireTime;
                } catch {}
            }

            if (memberId && nextExpireTime) {
                setQrValue(
                    JSON.stringify({
                        memberId,
                        expireTime: nextExpireTime
                    })
                );
            }

            reset();
            setRefreshing(false);
        });
    }, [expireTime, memberId, refetch, reset]);

    // 组件挂载时初始化倒计时
    useEffect(() => {
        if (memberId && expireTime && !initializedRef.current) {
            initializedRef.current = true;
            handleRefresh(false);
        }
    }, [expireTime, memberId, handleRefresh]);

    // 倒计时结束时自动刷新
    useEffect(() => {
        if (isFinished && initializedRef.current) {
            handleRefresh();
        }
    }, [isFinished]);

    useEffect(() => {
        return () => {
            debouncedRefresh.current.cancel();
        };
    }, []);

    return (
        <div className={classes.wrap}>
            <div className={classes.qrCodeWrap}>
                <span style={TITLE_STYLE}>{memberId}</span>
                <span style={SUBTITLE_STYLE}>
                    Scan in stores to earn points
                </span>
                <div
                    className={classes.qrCode}
                    style={{ position: 'relative' }}
                >
                    <QRCodeSVG
                        value={qrValue}
                        size={'100%'}
                        level="H"
                        fgColor="#000000"
                        onClick={handleRefresh}
                    />
                    {refreshing && (
                        <div className={classes.refreshMask}>
                            <LoadingIndicator>Refreshing</LoadingIndicator>
                        </div>
                    )}
                </div>
                <span className={classes.timerText}>
                    Auto refresh in ({formatCountdown})
                </span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 40 40"
                        fill="none"
                        onClick={handleRefresh}
                        style={{ cursor: 'pointer' }}
                    >
                        <circle cx="20" cy="20" r="20" fill="#E5E5E3" />
                        <circle cx="20" cy="20" r="19" fill="#FAFAFA" />
                        <path
                            d="M30 20C30 17.3478 28.9464 14.8043 27.0711 12.9289C25.1957 11.0536 22.6522 10 20 10C17.2044 10.0105 14.5211 11.1014 12.5111 13.0444L10 15.5556M10 15.5556V10M10 15.5556H15.5556M10 20C10 22.6522 11.0536 25.1957 12.9289 27.0711C14.8043 28.9464 17.3478 30 20 30C22.7956 29.9895 25.4789 28.8986 27.4889 26.9556L30 24.4444M30 24.4444H24.4444M30 24.4444V30"
                            stroke="#FF8200"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <div
                        className={classes.close}
                        onClick={() => {
                            history.goBack();
                        }}
                    >
                        Close
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QrCodePage;
