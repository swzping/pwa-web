import React from 'react';
import classes from './couponNoData.module.css';

const CouponNoData = props => {
    const { magText = 'No coupon at the moment' } = props;
    return (
        <div className={classes.couponNoData}>
            <div className={classes.noData}>
                <svg xmlns="http://www.w3.org/2000/svg" width="82" height="60" viewBox="0 0 82 60" fill="none">
                    <path
                        opacity="0.7"
                        d="M81.1522 22.8341L74.825 14.7647C74.3166 14.1192 73.7196 13.5511 73.0603 13.0734H73.0636H73.057C72.3092 12.5343 71.4826 12.105 70.5937 11.8178L45.9899 4.52946C44.1859 3.942 42.2375 3.942 40.4302 4.52946L14.557 11.8145C13.6616 12.105 12.8252 12.5375 12.0773 13.083H12.0708H12.074C11.418 13.5607 10.8276 14.1224 10.3258 14.7647L3.99852 22.8341C3.31954 23.7024 3.69347 24.9677 4.74309 25.3389L11.9855 27.9049V47.9074C11.9855 48.8822 12.6218 49.7472 13.5599 50.0539L39.7972 58.5945C41.6045 59.182 43.5528 59.182 45.3601 58.5945L71.6007 50.0539C72.5421 49.7472 73.1751 48.8822 73.1751 47.9074V27.9049L80.4142 25.3421C81.4606 24.9709 81.8378 23.7056 81.1588 22.8373L81.1522 22.8341Z"
                        fill="#FFC080"
                    />
                    <path
                        d="M69.6515 24.752V44.6799C69.6515 45.6511 69.0283 46.5129 68.1068 46.8179L42.3815 55.3267C40.6114 55.9134 38.6988 55.9134 36.9288 55.3267L11.2068 46.8179C10.2853 46.5129 9.66211 45.6511 9.66211 44.6799V24.752"
                        stroke="#424242"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M39.6572 19.0498V55.7634"
                        stroke="#424242"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M47.3075 3.05859L67.1228 8.7201C68.7669 9.26371 70.2121 10.2879 71.2728 11.6602L77.4746 19.6984C78.1409 20.5635 77.7729 21.8231 76.7454 22.1943L51.0299 31.449C50.1018 31.7838 49.0677 31.4755 48.4743 30.6899L39.6572 19.0454"
                        stroke="#424242"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M15.1077 26.7102L2.56491 22.1956C1.53736 21.8277 1.16942 20.5648 1.83568 19.6996L8.03748 11.6615C9.09486 10.2892 10.5401 9.26496 12.1875 8.72135L37.5283 1.92622C39.8519 1.31632 41.3502 1.38592 43.392 1.97594"
                        stroke="#424242"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M39.6566 19.0498L30.8395 30.6943C30.2462 31.4799 29.2087 31.7882 28.2839 31.4534L19.5762 28.3177"
                        stroke="#424242"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9.74805 9.98689L37.028 18.6416C38.7384 19.1852 40.5747 19.1852 42.2851 18.6416L69.5485 9.97363"
                        stroke="#424242"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <div className={classes.noDataText}>{magText}</div>
            </div>
        </div>
    );
};

export default CouponNoData;
