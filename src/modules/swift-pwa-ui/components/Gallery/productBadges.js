import React, { useState } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './productBadges.module.css';
import { arrayOf, string, shape } from 'prop-types';

const ProductBadges = ({ badges = [], isDetails = false, productLink, style = {} }) => {
    const classes = useStyle(defaultClasses);
    const [offersExpanded, setOffersExpanded] = useState(false);

    const _validBadges = [
        { name: 'Buy One Get One', description: 'Buy one get one free' },
        { name: 'Wardah item 1 pc add code $50 off', description: 'Wardah item 1 pc add code $50 off' },
        { name: 'test', description: 'test' }
    ];
    const validBadges = badges?.length > 0 ? badges : [];
    if (validBadges.length === 0) {
        return null;
    }

    const displayBadges = validBadges.slice(0, 2);
    const hasMore = validBadges.length > 2;

    const getBadgeBgColor = (promotionType) => {
        switch (promotionType) {
            case 'Coupon':     
                return '#FFD38B';
            case 'Free Gift':
                return '#DAECDA';
            case 'QD':
                return '#FFEC99';
            default:
                return '#B9D8FC';
        }
    };

    const getBadgeColor = (promotionType) => {
        switch (promotionType) {
            case 'Coupon':
                return '#FF8200';
            case 'Free Gift':
                return '#46A147';
            case 'QD':
                return '#B39100';
            default:
                return '#336ADD';
        }
    };

    return (
        <>
            {isDetails ? (
                <>
                    {(offersExpanded ? validBadges : validBadges.slice(0, 3)).map((badge, index) => (
                        <div key={index} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
                            <div className={classes.badge} style={{ margin: '8px 0', maxWidth: 'max-content', backgroundColor: getBadgeBgColor(badge?.promotion_type), color: getBadgeColor(badge?.promotion_type) }}>{badge?.name}</div>
                            {badge?.description && <div className={classes.description}>{badge.description}</div>}
                        </div>
                    ))}
                    {!offersExpanded && validBadges.length > 3 && (
                        <button type="button" className={classes.moreOffers} onClick={() => setOffersExpanded(true)} aria-expanded={false}>
                            View {validBadges.length - 3} more {validBadges.length === 4 ? 'offer' : 'offers'}
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </>
            ) : (
                <div className={classes.badgeWrap} style={style}>
                    {displayBadges.map((badge, index) => (
                        <div key={index} className={classes.badge} style={{backgroundColor: getBadgeBgColor(badge?.promotion_type), color: getBadgeColor(badge?.promotion_type)}}>
                            {badge?.name}
                        </div>
                    ))}
                    {hasMore && (
                        <div className={classes.badgeEllipsis} onClick={() => {
                            location.href = productLink;
                        }}>...</div>
                    )}
                </div>
            )}
        </>
    );
};

ProductBadges.propTypes = {
    badges: arrayOf({ name: string })
};

export default ProductBadges;
