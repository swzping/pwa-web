import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './index.module.css';
import { useHistory } from 'react-router-dom';
import { useCmsPage } from '@magento/peregrine/lib/talons/Cms/useCmsPage';
import RichContent from '@magento/venia-ui/lib/components/RichContent';
const InfoPop = ({ cms, onClose }) => {
    const classes = useStyle(defaultClasses);
    const [currentAmount, setCurrentAmount] = useState('');
    const history = useHistory();
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

    const talonProps = useCmsPage({ identifier: "point-info" });
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
                <div className={classes.close}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        onClick={onClose}
                    >
                        <path
                            d="M15.293 3.29297C15.6835 2.90244 16.3165 2.90244 16.707 3.29297C17.0976 3.68349 17.0976 4.31651 16.707 4.70703L11.4141 10L16.707 15.293C17.0976 15.6835 17.0976 16.3165 16.707 16.707C16.3165 17.0976 15.6835 17.0976 15.293 16.707L10 11.4141L4.70703 16.707C4.31651 17.0976 3.68349 17.0976 3.29297 16.707C2.90244 16.3165 2.90244 15.6835 3.29297 15.293L8.58594 10L3.29297 4.70703C2.90244 4.31651 2.90244 3.68349 3.29297 3.29297C3.68349 2.90244 4.31651 2.90244 4.70703 3.29297L10 8.58594L15.293 3.29297Z"
                            fill="black"
                        />
                    </svg>
                </div>
                <RichContent html={talonProps?.cmsPage?.content} />
                {/* <div className={classes.main}>
                    <div className={classes.title}>About Your Points:</div>
                    <div className={classes.rp}>1 Points = Rp 1.00</div>
                    <div>
                        1. This promo code an instant discount of IDR98 upon
                        spending of IDR$808.{' '}
                    </div>
                    <div>2. Points can be used for future purchases.</div>
                </div>
                <div className={classes.main}>
                    <div className={classes.title}>Terms and Conditions:</div>
                    <div>
                        1. This promo code an instant discount of IDR98 upon
                        spending of IDR$808.{' '}
                    </div>
                    <div>2. This coupon cannot be reused.</div>
                    <div>
                        3. This promo code cannot be used on yuu Discount Day,
                        enJoy Card Day, yuu Members Wednesdays Extra Offer Day
                        and other promotiontional day & period.
                    </div>
                </div>
                <div className={classes.main}>
                    <div className={classes.title}>General Conditions:</div>
                    <div>
                        1. Mannings reserves the right to amend the terms and
                        conditions or cancel the offer at any time without prior
                        notice.
                    </div>
                    <div>
                        2. The discounts cannot be used in guest checkout.
                    </div>
                    <div>3. The discounts can only be used once.</div>
                    <div>
                        4. The discounts are not applicable to purchase of
                        infant milk powder.
                    </div>
                    <div>
                        5. The discounts are not applicable to purchase of
                        infant milk powder.The discounts are not applicable to
                        purchase of infant milk powder.
                    </div>
                    <div>
                        6. The discounts are not applicable to purchase of
                        infant milk powder.The discounts are not applicable to
                        purchase of infant milk powder.
                    </div>
                    <div>
                        7. The discounts are not applicable to purchase of
                        infant milk powder.The discounts are not applicable to
                        purchase of infant milk powder.
                    </div>
                    <div>
                        8. The discounts are not applicable to purchase of
                        infant milk powder.The discounts are not applicable to
                        purchase of infant
                    </div>
                </div> */}
            </div>
        </div>
    );
};

export default InfoPop;
