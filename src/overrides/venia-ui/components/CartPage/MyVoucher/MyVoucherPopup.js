import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import './MyVoucherPopup.css';
import CouponPopUpDetails from "./couponPopUpDetails/couponPopDetails"
import { useWindowSize } from '@magento/peregrine';
import { useLazyQuery } from '@apollo/client';
import DEFAULT_OPERATIONS from '../../../../../modules/swift-pwa-ui/components/MyCoupon/myCoupon.gql.js'


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
const MyVoucherPopup = ({ onApply, isOpen, onClose }) => {
    const itemsPerPage = 20;
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedCouponCode, setSelectedCouponCode] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [couponData, setCouponData] = useState(null);
    const [isClick, setIsClick] = useState(true);

    const contentRef = useRef(null);

    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [fetchCoupons] = useLazyQuery(DEFAULT_OPERATIONS.getCouponWallet, {
        fetchPolicy: 'no-cache',
        onCompleted: (data) => {
            setLoading(false);
            const newCoupons = data?.customerCoupons?.items || [];
            const totalCount = data?.customerCoupons?.totalCount || 0;

            if (currentPage === 1) {
                setCoupons(newCoupons);
            } else {
                setCoupons(prev => [...prev, ...newCoupons]);
            }

            if (coupons.length + newCoupons.length >= totalCount) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        },
        onError: () => {
            setLoading(false);
            setHasMore(false);
        }
    });
    const copyCode = (couponCode, index, e) => {
        if (!isClick) return;
        e.stopPropagation();
        navigator.clipboard
            .writeText(couponCode)
            .then(() => {
                setCopiedIndex(index);
                setTimeout(() => setCopiedIndex(null), 1000);
            })
            .catch((err) => console.log('coopon code error: ', err));
    };

    const loadMoreCoupons = useCallback(() => {
        if (loading || !hasMore) return;

        setLoading(true);
        fetchCoupons({ variables: { currentPage: currentPage, pageSize: itemsPerPage, status: 'valid', } });
        setCurrentPage(prevPage => prevPage + 1);
    }, [loading, hasMore, fetchCoupons, currentPage]);

    useEffect(() => {
        if (coupons.length === 0) {
            loadMoreCoupons();
        }

        const handleScroll = () => {
            if (contentRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                if (scrollTop + clientHeight >= scrollHeight - 50) {
                    loadMoreCoupons();
                }
            }
        };

        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (contentElement) {
                contentElement.removeEventListener('scroll', handleScroll);
            }
        };
    }, [loadMoreCoupons, coupons.length]);

    if (!isOpen) {
        return null;
    }

    const toggleCoupon = (couponCode) => setSelectedCouponCode(prev => prev === couponCode ? "" : couponCode);

    const handleApply = () => {
        if (selectedCouponCode) {
            onApply(selectedCouponCode)
            onClose();
        } else {
            alert("Please select a coupon.");
        }
    };

    const lookTheDetials = (datas) => {
        setIsModalOpen(true);
        setCouponData(datas);
    };

    const popupContent = (
        <div className="popup-overlay-voucher">
            <div className="popup-container">
                <header className="popup-header">
                    <button className="back-button" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <h1 className="header-title">My eVoucher</h1>
                </header>

                <main className="popup-main-content" ref={contentRef}>
                    {coupons.length === 0 && !loading && <div className="no-coupons-message">No coupons found.</div>}
                    {coupons.map((coupon, index) => (
                        <div
                            key={coupon.code}
                            className={`mycoupon-card ${coupon.status === 'valid' ? 'selected' : 'coupon-disabled-select'}`}
                        >
                            <div className="coupon-main-info">
                                <div className="coupon-details-row">
                                    <div className='mybutton-div'>
                                        <button
                                            className={`myselect-btn ${selectedCouponCode === coupon.code ? 'selected' : ''}`}
                                            onClick={() => coupon.status === 'valid' && toggleCoupon(coupon.code)}
                                            disabled={coupon.status !== 'valid'}
                                        />
                                    </div>
                                    <h2 className="mycoupon-title one-line-ellipsis">{coupon.name}</h2>
                                    <p className="myproduct-desc two-line-ellipsis">{coupon.description}</p>
                                    <div className="mycoupon-code-row">
                                        <div><span className="mycoupon-details-text" onClick={() => lookTheDetials(coupon)}>Details</span></div>

                                        <div className='mycoupon-code-row-code'>
                                            <span className="mycoupon-code one-line-ellipsis-mydeatil">{coupon.code}</span>
                                            <div className="mycopy-icon-container" >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" onClick={(e) => copyCode(coupon.code, index, e)}>
                                                    <path d="M9.89608 4.8526H3.93916C3.57275 4.8526 3.22135 4.99815 2.96226 5.25724C2.70317 5.51633 2.55762 5.86773 2.55762 6.23414V12.1203C2.55762 12.4867 2.70317 12.8381 2.96226 13.0972C3.22135 13.3563 3.57275 13.5018 3.93916 13.5018H9.89608C10.2625 13.5018 10.6139 13.3563 10.873 13.0972C11.1321 12.8381 11.2776 12.4867 11.2776 12.1203V6.23414C11.2776 5.86773 11.1321 5.51633 10.873 5.25724C10.6139 4.99815 10.2625 4.8526 9.89608 4.8526ZM8.42531 9.76952H7.533V10.6618C7.533 10.825 7.46817 10.9816 7.35276 11.097C7.23735 11.2124 7.08083 11.2772 6.91762 11.2772C6.83672 11.2775 6.75657 11.2618 6.68178 11.231C6.60699 11.2001 6.53904 11.1548 6.48184 11.0976C6.42464 11.0404 6.37932 10.9725 6.3485 10.8977C6.31767 10.8229 6.30195 10.7427 6.30223 10.6618V9.76952H5.40992C5.32903 9.76981 5.24888 9.75409 5.17409 9.72326C5.0993 9.69243 5.03135 9.64712 4.97415 9.58992C4.91695 9.53272 4.87163 9.46476 4.8408 9.38997C4.80998 9.31518 4.79426 9.23503 4.79454 9.15414C4.79454 8.99093 4.85938 8.8344 4.97478 8.719C5.09019 8.60359 5.24671 8.53875 5.40992 8.53875H6.30223V7.64645C6.30195 7.56555 6.31767 7.4854 6.3485 7.41061C6.37932 7.33582 6.42464 7.26787 6.48184 7.21067C6.53904 7.15347 6.60699 7.10815 6.68178 7.07733C6.75657 7.0465 6.83672 7.03078 6.91762 7.03106C7.08083 7.03106 7.23735 7.0959 7.35276 7.2113C7.46817 7.32671 7.533 7.48324 7.533 7.64645V8.53875H8.42531C8.58852 8.53875 8.74505 8.60359 8.86045 8.719C8.97586 8.8344 9.04069 8.99093 9.04069 9.15414C9.04098 9.23503 9.02526 9.31518 8.99443 9.38997C8.96361 9.46476 8.91829 9.53272 8.86109 9.58992C8.80389 9.64712 8.73593 9.69243 8.66114 9.72326C8.58635 9.75409 8.5062 9.76981 8.42531 9.76952Z" fill="#FF8200" />
                                                    <path d="M12.2005 2.49634H6.52847C6.44766 2.49634 6.36763 2.51226 6.29297 2.54318C6.21831 2.57411 6.15047 2.61944 6.09333 2.67658C6.03618 2.73372 5.99086 2.80156 5.95993 2.87622C5.929 2.95089 5.91309 3.03091 5.91309 3.11172C5.91309 3.27493 5.97792 3.43146 6.09333 3.54687C6.20873 3.66227 6.36526 3.72711 6.52847 3.72711H12.2005C12.2527 3.72719 12.3027 3.74796 12.3396 3.78487C12.3765 3.82179 12.3973 3.87183 12.3974 3.92403V9.65449C12.3974 9.73531 12.4133 9.81533 12.4442 9.88999C12.4752 9.96465 12.5205 10.0325 12.5776 10.0896C12.6348 10.1468 12.7026 10.1921 12.7773 10.223C12.8519 10.254 12.932 10.2699 13.0128 10.2699C13.0936 10.2699 13.1736 10.254 13.2483 10.223C13.3229 10.1921 13.3908 10.1468 13.4479 10.0896C13.5051 10.0325 13.5504 9.96465 13.5813 9.88999C13.6122 9.81533 13.6282 9.73531 13.6282 9.65449V3.92403C13.6278 3.54551 13.4772 3.18261 13.2096 2.91495C12.9419 2.64729 12.579 2.49675 12.2005 2.49634Z" fill="#FF8200" />
                                                </svg>
                                            </div>
                                            {copiedIndex === index && (
                                                <div className="mycopied-tooltip">
                                                    <span>Code copied</span>
                                                    <div className="mytooltip-arrow"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='myline'>
                                <div className='myclyle-left'></div>
                                <div className='myrowLineStyle'></div>
                                <div className='myclyle-right'></div>
                            </div>
                            <p className="valid-date">Valid date:{formatDateRange(coupon.from_date, coupon.to_date)} </p>
                        </div>
                    ))}
                    {loading && <div className="loading-message">Loading...</div>}
                    {!hasMore && coupons.length > 0 && <div className="no-more-coupons">You've reached the end.</div>}
                </main>

                <footer className="popup-footer">
                    <button
                        className="apply-button"
                        onClick={handleApply}
                        disabled={!selectedCouponCode}
                    >
                        Confirm
                    </button>
                </footer>

                {isModalOpen && (
                    <CouponPopUpDetails
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        coupon={couponData}
                    />
                )}
            </div>
        </div>
    );

    return createPortal(popupContent, document.body);
};

export default MyVoucherPopup;
