import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import InfoPop from '../../Header/components/AccountInfo/InfoPop';
import { useToasts } from '@magento/peregrine';
import classes from './pointsDrawer.module.css';

export const GET_CUSTOMER = gql`
    query {
        customer {
            firstname
            lastname
            phonenumber
            qr_code {
                memberId
                expireTime
            }
        }
        storeConfig {
            store_code
            cms_homepage_identifer
        }
    }
`;

const PointsDrawer = ({ isOpen, onClose, get_redeem_points, onConfirm }) => {
    const [currentAmount, setCurrentAmount] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isInfoPopOpen, setIsInfoPopOpen] = useState(false);
    const [, { addToast }] = useToasts();
    const [activeIndex, setActiveIndex] = useState(-1);

    const { data } = useQuery(GET_CUSTOMER, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    useEffect(() => {
        setCurrentAmount('');
        return () => {
            setActiveIndex(-1)
        }
    }, [isOpen])

    const roundDownToHundred = value => {
        const raw = String(value || '').replace(/\D/g, '');
        if (raw === '') {
            setCurrentAmount('');
            return;
        }
        const num = Number(raw);
        if (num <= 0) {
            setCurrentAmount('');
            return;
        }
        // Todo不能超过可用余额，不得超过订单总金额
        const maxAvailable = Number(get_redeem_points) || 0;
        if (maxAvailable > 0 && num > maxAvailable) {
            setCurrentAmount(String(num));
            return;
        } 
        // else {
        //     const totalPriceEl = document.getElementById('totalPriceTest');
        //     if (totalPriceEl) {
        //         // Extract numeric value from the price text (remove currency symbol, commas)
        //         const totalText = totalPriceEl.textContent || '';
        //         const totalNum = Number(totalText.replace(/[^\d.]/g, ''));
        //         if (!isNaN(totalNum) && num < totalNum) {
        //             setCurrentAmount(String(Math.floor(totalNum)));
        //             return;
        //         }
        //     }
        // }
        let rounded = Math.floor(num / 100) * 100;
        if (rounded < 100) {
            rounded = num;
        }
        setCurrentAmount(String(rounded));
    };

    const handleConfirm = () => {
        const raw = String(currentAmount || '').replace(/\D/g, '');
        if (!raw) return;
        const points = Number(raw);
        let totalNum = 0;
        const totalPriceEl = document.getElementById('totalPriceElement');
        if(totalPriceEl) {
            const totalText = totalPriceEl.textContent || '';
            totalNum = Number(totalText.replace(/[^\d.]/g, ''));
        }
        if(points < 100) {
            addToast({
                type: 'error',
                message: 'Minimum redemption is 100 points (Rp 100.00)',
                dismissable: true
            });
            return
        } else if(points > Number(get_redeem_points)) {
            if(points > totalNum) {
                addToast({
                    type: 'error',
                    message: 'Points cannot exceed order total',
                    dismissable: true
                });
            } else {
                addToast({
                    type: 'error',
                    message: 'Insufficient points',
                    dismissable: true
                });
            }
            return
        }
        onConfirm && onConfirm(points);
    };

    const formatPoints = value => {
        const stringValue = String(value != null ? value : '');
        const isNegative = stringValue.trim().startsWith('-');
        const raw = stringValue.replace(/[^0-9]/g, '');
        if (raw === '') return '';
        const formatted = Number(raw).toLocaleString();
        return isNegative ? `-${formatted}` : formatted;
    };

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const isConfirmDisabled = !currentAmount;

    const modalContent = (
        <div className={`${classes.root} ${isOpen ? classes.root_open : ''}`}>
            <div 
                className={`${classes.mask} ${isOpen ? classes.mask_open : ''}`} 
                onClick={onClose}
            />
            <div className={`${classes.drawer} ${isOpen ? classes.drawer_open : ''}`}>
                <div className={classes.title}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={classes.close}
                        onClick={onClose}
                    >
                        <path
                            d="M18 6L6 18M6 6L18 18"
                            stroke="#373036"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span>Burn Your Points</span>
                </div>
                <div className={classes.banner}>
                    <div className={classes.bannerNum}>
                        <span id="get_redeem_points">{formatPoints(get_redeem_points)}</span>
                        <img
                            style={{ margin: '0 4px', width: '20px', height: '20px' }}
                            src={'/venia-static-assets/images/gim.png'}
                            alt="coin"
                        />
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            onClick={() => setIsInfoPopOpen(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            <path
                                d="M16 6.25C12.4844 6.25 9.29688 8.125 7.51562 11.125C5.78125 14.1719 5.78125 17.875 7.51562 20.875C9.29688 23.9219 12.4844 25.75 16 25.75C19.4688 25.75 22.6562 23.9219 24.4375 20.875C26.1719 17.875 26.1719 14.1719 24.4375 11.125C22.6562 8.125 19.4688 6.25 16 6.25ZM16 28C11.6875 28 7.75 25.75 5.59375 22C3.4375 18.2969 3.4375 13.75 5.59375 10C7.75 6.29688 11.6875 4 16 4C20.2656 4 24.2031 6.29688 26.3594 10C28.5156 13.75 28.5156 18.2969 26.3594 22C24.2031 25.75 20.2656 28 16 28ZM14.125 19.75H15.25V16.75H14.125C13.4688 16.75 13 16.2812 13 15.625C13 15.0156 13.4688 14.5 14.125 14.5H16.375C16.9844 14.5 17.5 15.0156 17.5 15.625V19.75H17.875C18.4844 19.75 19 20.2656 19 20.875C19 21.5312 18.4844 22 17.875 22H14.125C13.4688 22 13 21.5312 13 20.875C13 20.2656 13.4688 19.75 14.125 19.75ZM16 13C15.1562 13 14.5 12.3438 14.5 11.5C14.5 10.7031 15.1562 10 16 10C16.7969 10 17.5 10.7031 17.5 11.5C17.5 12.3438 16.7969 13 16 13Z"
                                fill="black"
                            />
                        </svg>
                    </div>
                    <span className={classes.bannerMemo}>
                        The minimum amount is Rp100.00, and it must be a
                        multiple of this amount.
                    </span>
                </div>
                {isInfoPopOpen && (
                    <InfoPop
                        cms={data?.storeConfig?.cms_homepage_identifer}
                        onClose={() => setIsInfoPopOpen(false)}
                    />
                )}
                <div className={classes.exchange}>
                    <div className={classes.rp}>1 Points = Rp 1.00</div>
                    <div className={classes.redeem}>
                        <img
                            style={{ margin: '0 4px', width: '24px', height: '24px' }}
                            src={'/venia-static-assets/images/gim.png'}
                            alt="coin"
                        />
                        <div className={classes.redeemRight}>
                                <div className={classes.redeemHeader}>
                                <span className={classes.redeemLabel}>
                                    Redeem Amount
                                </span>
                                <div
                                    className={classes.redeemAll}
                                    onClick={() => {
                                        let max = Number(get_redeem_points) || 0;
                                        const totalPriceEl = document.getElementById('totalPriceElement');
                                        if (totalPriceEl) {
                                            const totalText = totalPriceEl.textContent || '';
                                            const totalNum = Number(totalText.replace(/[^\d.]/g, ''));
                                            if (!isNaN(totalNum) && totalNum > 0 && totalNum < max) {
                                                max = totalNum;
                                            }
                                        }
                                        if (!max) {
                                            setCurrentAmount('');
                                            setIsEditing(false);
                                            return;
                                        }
                                        let val;
                                        if (max < 100) {
                                            val = max;
                                        } else {
                                            val = Math.floor(max / 100) * 100;
                                            if (val < 100) val = 100;
                                        }
                                        setCurrentAmount(String(val));
                                        setIsEditing(false);
                                    }}
                                >
                                    Redeem All
                                </div>
                            </div>
                            <input
                                className={`${classes.redeemInput} ${
                                    !currentAmount ? '' : classes.hasVal
                                }`}
                                placeholder="Enter the points that you want to redeem"
                                value={isEditing ? currentAmount : formatPoints(currentAmount)}
                                onFocus={() => setIsEditing(true)}
                                onChange={e => {
                                    const digits = String(e?.target?.value || '').replace(/\D/g, '');
                                    setCurrentAmount(digits);
                                }}
                                onBlur={() => {
                                    setIsEditing(false);
                                    roundDownToHundred(currentAmount);
                                }}
                            />
                        </div>
                    </div>
                    {currentAmount && (
                        <div className={classes.rp2}>
                            Order will save <span style={{ fontWeight: 700 }}>Rp {formatPoints(currentAmount)}</span>
                        </div>
                    )}
                    <div>
                        <div className={classes.quickTitle}>
                            Quick selection
                        </div>
                        <div className={classes.quickList}>
                            {[500, 1000, 2000, 5000, 10000, 20000, 50000, 100000].map((item, index) => (
                                <div
                                    className={`${classes.quickItem} ${activeIndex === index ? classes.quickItemActive : ''}`}
                                    key={item}
                                    onClick={() => {
                                        setActiveIndex(index);
                                        setCurrentAmount(String(item));
                                        setIsEditing(false);
                                    }}
                                >
                                    <span>{item.toLocaleString()}</span>
                                    <img
                                        style={{ margin: '0 4px', width: '20px', height: '20px' }}
                                        src={'/venia-static-assets/images/gim.png'}
                                        alt="coin"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={classes.confirmContainer}>
                        <button
                            type="button"
                            className={`${classes.confirm} ${isConfirmDisabled ? classes.confirm_disabled : ''}`}
                            disabled={isConfirmDisabled}
                            onClick={handleConfirm}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default PointsDrawer;
