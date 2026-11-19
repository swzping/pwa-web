import React, { useRef, useState, useEffect } from 'react';
import './couponCampaignNew.css';
import PopUpWindow from '../../../venia-ui/components/PopUpWindow/popUpWindow';
import CouponDetail from './components/couponDeatial/coupouDeatial';
import { useQuery, useMutation } from '@apollo/client';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import DEFAULT_OPERATIONS from './coupon.gql';
import { useHistory } from 'react-router-dom';
import { useWindowSize } from '@magento/peregrine';
import CouponPopUpDetails from './components/couponPopUpDetails/couponPopDetails';
import CouponCard from './components/CouponCard/couponCard';
import { useToasts } from '@magento/peregrine/lib/Toasts';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { Check, AlertCircle } from 'react-feather';

const CheckIcon = <Icon size={20} src={Check} />;
const ErrorIcon = <Icon size={20} src={AlertCircle} />;
const CouponCampaignNew = (propsData) => {
    const operations = mergeOperations(DEFAULT_OPERATIONS);
    const { getCoupons, collectCouPon } = operations;
    const history = useHistory();
    const windowSize = useWindowSize();
    const [, { addToast }] = useToasts();
    const isMobile = windowSize.innerWidth <= 767;

    const [currentPage, setCurrentPage] = useState(0);

    const scrollContainerRef = useRef(null);
    const dotsContainerRef = useRef(null);

    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const [isClick, setIsClick] = useState(true);

    const { data: couponDatas, loading, refetch: refetchCoupons } = useQuery(getCoupons, {
        variables: {
            currentPage: 1,
            pageSize: 5
        },
        fetchPolicy: 'no-cache'
    });

    const [fetchCollectCouponWallet] = useMutation(collectCouPon, {
        fetchPolicy: 'no-cache'
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [couponData, setCouponData] = useState({});
    const [copiedIndex, setCopiedIndex] = useState(null);

    const ensureActiveDotInView = (index) => {
        if (!dotsContainerRef.current) return;
        const container = dotsContainerRef.current;
        const dot = container.querySelector(`.coupon-dot[data-index="${index}"]`);
        if (!dot) return;
        const dotLeft = dot.offsetLeft;
        const targetLeft = dotLeft - container.clientWidth / 2 + dot.offsetWidth / 2;
        const maxLeft = container.scrollWidth - container.clientWidth;
        const clamped = Math.max(0, Math.min(targetLeft, maxLeft));
        container.scrollTo({ left: clamped, behavior: 'smooth' });
    };

    const coupons = couponDatas?.coupons?.items || [];

    const linkToSignInPage = () => {
        history.push('/sign-in');
    };

    const sendDataToPopUp = (data) => {
        setIsModalOpen(true);
        setCouponData(data);
    };

    const getClientX = (e) => {
        return e.touches ? e.touches[0].clientX : e.clientX;
    };

    const handleMove = (e) => {
        if (!isDragging.current) return;
        const clientX = getClientX(e);
        const walk = clientX - startX.current;
        if (Math.abs(walk) > 5) {
            setIsClick(false);
            e.preventDefault();
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
            }
        }
    };

    const handleEnd = () => {
        isDragging.current = false;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
        }
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
    };

    const handleStart = (e) => {
        isDragging.current = true;
        startX.current = getClientX(e);
        if (scrollContainerRef.current) {
            scrollLeft.current = scrollContainerRef.current.scrollLeft;
            scrollContainerRef.current.style.cursor = 'grabbing';
        }
        setIsClick(true);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    };

    const handleScrollEvent = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollPosition = container.scrollLeft;

        const couponCards = container.querySelectorAll('.coupon-card');
        if (couponCards.length === 0) return;

        let closestIndex = 0;
        let minDifference = Infinity;

        couponCards.forEach((card, index) => {
            const cardLeft = card.offsetLeft;
            const difference = Math.abs(scrollPosition - cardLeft);

            if (difference < minDifference) {
                minDifference = difference;
                closestIndex = index;
            }
        });

        setCurrentPage(closestIndex);

        ensureActiveDotInView(closestIndex);
    };

    const handleScroll = (direction) => {
        if (!scrollContainerRef.current) return;
        const firstCouponCard = scrollContainerRef.current.querySelector('.coupon-card');
        if (!firstCouponCard) return;

        const cardWidth = firstCouponCard.offsetWidth;
        scrollContainerRef.current.scrollBy({
            left: direction === 'next' ? cardWidth : -cardWidth,
            behavior: 'smooth'
        });
    };

    const handleDotClick = (index) => {
        if (!scrollContainerRef.current) return;
        const couponCard = scrollContainerRef.current.querySelectorAll('.coupon-card')[index];
        if (!couponCard) return;

        const cardLeft = couponCard.offsetLeft;
        scrollContainerRef.current.scrollTo({
            left: cardLeft,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScrollEvent);
        container.addEventListener('mousedown', handleStart);
        container.addEventListener('touchstart', handleStart, { passive: false });

        return () => {
            container.removeEventListener('scroll', handleScrollEvent);
            container.removeEventListener('mousedown', handleStart);
            container.removeEventListener('touchstart', handleStart);
        };
    }, []);

    useEffect(() => {
        const id = requestAnimationFrame(() => handleScrollEvent());
        return () => cancelAnimationFrame(id);
    }, [coupons.length, isMobile]);

    const claimCoupon = async (code, e) => {
        if (!isClick) return;
        e.stopPropagation();
        try {
            const { data } = await fetchCollectCouponWallet({
                variables: { couponCode: code }
            });
            if (data) {
                addToast({
                    type: 'success',
                    icon: CheckIcon,
                    message: 'The coupon has already been claimed!',
                    dismissable: true,
                    timeout: 7000
                });
                refetchCoupons()
            }
        } catch (error) {
            // linkToSignInPage();
            addToast({
                type: 'error',
                icon: ErrorIcon,
                message: 'Sorry, the operation failed, please try again!',
                dismissable: true,
                timeout: 7000
            });
        }
    };

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

    return (
        <div className='outBox'>
            <div className="coupon-container">
                <div
                    className="coupon-scroll"
                    ref={scrollContainerRef}
                    onMouseDown={handleStart}
                    onTouchStart={handleStart}
                    style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
                >
                    <div className="coupon-scroll-inner">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                                <p>Loading coupons...</p>
                            </div>
                        ) : (
                            [...coupons, ...coupons].map((coupon, index) => {
                                // const isClaimed = claimedCodes.includes(coupon.code);
                                return (
                                    <CouponCard
                                        key={coupon.code || index}
                                        coupon={coupon}
                                        index={index}
                                        isMobile={isMobile}
                                        isClaimed={coupon.is_claimed}
                                        copyCode={copyCode}
                                        claimCoupon={claimCoupon}
                                        sendDataToPopUp={sendDataToPopUp}
                                        isClick={isClick}
                                        copiedIndex={copiedIndex}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
                {/* <div className="coupon-dots-container" ref={dotsContainerRef}>
                    {coupons.length > 0 && Array(coupons.length).fill(null).map((_, index) => (
                        <div
                            key={index}
                            data-index={index}
                            className={`coupon-dot ${index === currentPage ? 'active' : ''}`}
                            onClick={() => handleDotClick(index)}
                        ></div>
                    ))}
                </div> */}
                <div>
                    <PopUpWindow isOpen={!isMobile && isModalOpen} onClose={() => setIsModalOpen(false)}>
                        <CouponDetail coupon={couponData} />
                    </PopUpWindow>
                </div>
                {(isMobile && isModalOpen) && (
                    <CouponPopUpDetails
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        coupon={couponData}
                    />
                )}
            </div>
        </div>
    );
};

export default CouponCampaignNew;
