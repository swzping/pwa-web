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
        <div className={`popup-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}>
            <div
                className={`popup-content ${isOpen ? 'slide-up' : 'slide-down'}`}
                onClick={(e) => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
            >
                <div className="coupon-detail-container">
                    <div className="close-button" onClick={onClose}>
                        &times;
                    </div>

                    <div className="coupon-detail-header">
                        <div className="header-icon">
                            <img src={coupon.image && coupon.image[0]} alt="coupon-icon" />
                        </div>
                        <div className="header-title">{coupon.name}</div>
                    </div>

                    <div className="coupon-detail-content">
                        <div className="coupon-detail-desc">{coupon.description}</div>

                        <div className="coupon-detail-valid-date">
                            <p>Valid date: {formatDateRange(coupon.from_date, coupon.to_date)}</p>
                            <p>{coupon.group}</p>
                        </div>
                    </div>

                    <div className='conditions-list'>
                        {parse(coupon.t_and_c)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CouponPopUpDetails;