import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './index.module.css';
import { useHistory } from 'react-router-dom';

const PointsPop = ({ onClose }) => {
    const classes = useStyle(defaultClasses);
    const [currentAmount, setCurrentAmount] = useState('');
    const history = useHistory();
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

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

    return (
        <div className={classes.mask} onClick={onClose}>
            <div
                className={classes.wrap}
                onClick={e => {
                    e.stopPropagation();
                }}
            >
                <div className={classes.title}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="24"
                        viewBox="0 0 48 24"
                        fill="none"
                        className={classes.close}
                        onClick={onClose}
                    >
                        <path
                            d="M18.7031 6.70703L13.4102 12L18.7031 17.293L17.2891 18.707L11.9961 13.4141L6.70312 18.707L5.28906 17.293L10.582 12L5.28906 6.70703L6.70312 5.29297L11.9961 10.5859L17.2891 5.29297L18.7031 6.70703Z"
                            fill="#373036"
                        />
                    </svg>
                    <span>Burn Your Points</span>
                </div>
                <div className={classes.banner}>
                    <div className={classes.bannerNum}>
                        <span>150,000</span>
                        <img
                            style={{ margin: '0 4px' }}
                            src={'/venia-static-assets/images/gim.png'}
                        />
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M16 6.25C12.4844 6.25 9.29688 8.125 7.51562 11.125C5.78125 14.1719 5.78125 17.875 7.51562 20.875C9.29688 23.9219 12.4844 25.75 16 25.75C19.4688 25.75 22.6562 23.9219 24.4375 20.875C26.1719 17.875 26.1719 14.1719 24.4375 11.125C22.6562 8.125 19.4688 6.25 16 6.25ZM16 28C11.6875 28 7.75 25.75 5.59375 22C3.4375 18.2969 3.4375 13.75 5.59375 10C7.75 6.29688 11.6875 4 16 4C20.2656 4 24.2031 6.29688 26.3594 10C28.5156 13.75 28.5156 18.2969 26.3594 22C24.2031 25.75 20.2656 28 16 28ZM14.125 19.75H15.25V16.75H14.125C13.4688 16.75 13 16.2812 13 15.625C13 15.0156 13.4688 14.5 14.125 14.5H16.375C16.9844 14.5 17.5 15.0156 17.5 15.625V19.75H17.875C18.4844 19.75 19 20.2656 19 20.875C19 21.5312 18.4844 22 17.875 22H14.125C13.4688 22 13 21.5312 13 20.875C13 20.2656 13.4688 19.75 14.125 19.75ZM16 13C15.1562 13 14.5 12.3438 14.5 11.5C14.5 10.7031 15.1562 10 16 10C16.7969 10 17.5 10.7031 17.5 11.5C17.5 12.3438 16.7969 13 16 13Z"
                                fill="white"
                            />
                        </svg>
                    </div>
                    <span className={classes.bannerMemo}>
                        The minimum amount is Rp100.00, and it must be a
                        multiple of this amount.
                    </span>
                </div>
                <div className={classes.exchange}>
                    <div className={classes.rp}>1 Points = Rp 1.00</div>
                    <div className={classes.redeem}>
                        <img
                            style={{ margin: '0 4px' }}
                            src={'/venia-static-assets/images/gim.png'}
                        />
                        <div className={classes.redeemRight}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 20
                                }}
                            >
                                <span
                                    style={{
                                        color: '#212121',
                                        fontSize: 16,
                                        fontWeight: 500
                                    }}
                                >
                                    Redeem Amount
                                </span>
                                <div className={classes.redeemAll}>
                                    Redeem All
                                </div>
                            </div>
                            <input
                                className={`${classes.redeemInput} ${
                                    !currentAmount ? '' : classes.hasVal
                                }`}
                                placeholder="Enter the points that you want to redeem"
                                value={currentAmount}
                                onChange={e => {
                                    setCurrentAmount(e?.target?.value);
                                }}
                            />
                        </div>
                    </div>
                    {currentAmount && (
                        <div className={classes.rp2}>
                            Order will save Rp {currentAmount}
                        </div>
                    )}
                    <div>
                        <div className={classes.quickTitle}>
                            Quick selection
                        </div>
                        <div className={classes.quickList}>
                            {[10000, 50000, 100000, 150000].map(item => (
                                <div
                                    className={classes.quickItem}
                                    key={item}
                                    onClick={() => {
                                        setCurrentAmount(item);
                                    }}
                                >
                                    <span>{item.toLocaleString()}</span>
                                    <img
                                        style={{ margin: '0 4px' }}
                                        src={
                                            '/venia-static-assets/images/gim.png'
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={classes.confirm}>Confirm</div>
                </div>
            </div>
        </div>
    );
};

export default PointsPop;
