import React from 'react';

/**
 * Discount corner ribbon — app ProductItem / ProductDetail
 * parity (DiscountIcon + overlaid percentage). The SVG has
 * the "DISCOUNT" strip baked in; the numeric part is
 * rendered as text under it. `width` follows the badge
 * scale of the surface: 32 on PLP cards, 67 on PDP media —
 * the same sizes as the app. The % suffix is a fixed 6px,
 * matching the app at both scales.
 */
const DiscountRibbon = ({ percent, width = 60 }) => (
    <div style={{ position: 'relative', width, flexShrink: 0 }}>
        <img
            style={{ margin: 0, borderRadius: 0, display: 'block', width: '100%' }}
            src="/venia-static-assets/images/discountRibbon.svg"
            alt=""
        />
        <span
            style={{
                position: 'absolute',
                top: '44%',
                left: 0,
                width: '100%',
                textAlign: 'center',
                fontWeight: 'bold',
                lineHeight: 1,
                fontSize: Math.round(width * 0.36),
                color: '#EF4539'
            }}
        >
            {Math.floor(Number(percent))}
            <span style={{ fontSize: 6, color: '#EF4539' }}>%</span>
        </span>
    </div>
);

export default DiscountRibbon;
