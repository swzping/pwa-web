import React, { useEffect, useState } from 'react';
import './couponPopDetails.css';
import parse from "html-react-parser";

const formatDateRange = (from_date, to_date) => {
    const format = (dateStr) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    };

    return `${format(from_date)} - ${format(to_date)}`;
}

const CouponPopUpDetails = ({ isOpen, onClose, coupon }) => {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
        }
    }, [isOpen]);

    const handleAnimationEnd = () => {
        if (!isOpen) {
            setShouldRender(false);
        }
    };

    if (!shouldRender) {
        return null;
    }

    return (
        <div className={`myvoucher-popup-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}>
            <div
                className={`myvoucher-popup-content ${isOpen ? 'myvoucher-slide-up' : 'myvoucher-slide-down'}`}
                onClick={(e) => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
            >
                <div className="myvoucher-coupon-detail-container">
                    <div className="myvoucher-close-button" onClick={onClose}>
                        &times;
                    </div>

                    <div className="myvoucher-coupon-detail-header">
                        <div className="myvoucher-header-icon">
                            <img src={coupon.image && coupon.image[0]} alt="myvoucher-coupon-icon" />
                        </div>
                        <div className="myvoucher-header-title">{coupon.name}</div>
                    </div>

                    <div className="myvoucher-coupon-detail-content">
                        <div className="myvoucher-coupon-detail-desc">{coupon.description}</div>

                        <div className="myvoucher-coupon-detail-valid-date">
                            <p>Valid date:{formatDateRange(coupon?.from_date, coupon?.to_date)}</p>
                            <p>{coupon.group}</p>
                        </div>
                    </div>

                    <div className='myvoucher-conditions-list'>
                        {parse(coupon.t_and_c)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CouponPopUpDetails;