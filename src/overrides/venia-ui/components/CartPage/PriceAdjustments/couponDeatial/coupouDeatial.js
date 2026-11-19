import "./couponDeatials.css"
import parse from "html-react-parser";
import React, { useState, useEffect } from 'react';


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

const CouponDetail = ({ coupon }) => {
    return (
            <div>
            <div className='deatilHeaderInfo'>
                <div className="card-left-detail">
                    <div>
                        <img
                            style={{
                                width: '100%',
                                height: '100px'
                            }}
                            src={coupon.image[0]}
                            alt={coupon.description}
                        />
                    </div>
                </div>
                <div className="card-right-detail">
                    <div className="card-title-detail one-line-ellipsis-deatil">{coupon.name}</div>
                    <div className="card-des two-line-ellipsis-deatil">{coupon.description}</div>
                    <div className="buttom-info">
                        <div >{coupon.group}</div>
                        <div>Valid date:{formatDateRange(coupon?.from_date, coupon?.to_date)}</div>
                    </div>
                </div>
            </div>
            <div className="code">Code:{coupon.code}</div>
            <div className="detailInfo">
                <div>
                   {parse(coupon.t_and_c)}
                </div>

            </div>
            </div>
    );
};

export default CouponDetail