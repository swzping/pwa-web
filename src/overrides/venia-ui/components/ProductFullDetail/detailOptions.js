import React, { useEffect, useState } from 'react';

import { getOptionValuePresentation } from './productOptions';
import { getFlashSaleOptionUids } from '../../../../modules/swift-pwa-ui/components/Gallery/addToCartModal.flashSale';

const cx = (...classNames) => classNames.filter(Boolean).join(' ');

const DetailOptions = ({ classes, groups, onSelect, selectedOptions, product }) => {
    const [now, setNow] = useState(Date.now);
    const hasFlashSaleVariants = product?.variants?.some(variant => variant.product?.is_flash_sale === 1);

    useEffect(() => {
        if (!hasFlashSaleVariants) return;
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [hasFlashSaleVariants]);

    if (!groups?.length) {
        return null;
    }

    const flashSaleOptionUids = getFlashSaleOptionUids(product, groups, selectedOptions, now);

    return (
        <section className={classes.detailOptions}>
            {groups.map(group => (
                <div className={classes.detailOptionGroup} key={group.id}>
                    <p className={classes.detailOptionTitle}>{group.label}</p>
                    <div className={classes.detailOptionGrid}>
                        {group.values.map(value => {
                            const {
                                isDisabled,
                                isUnavailable,
                                label,
                                stockLabel,
                                swatchContent,
                                valueId,
                            } = getOptionValuePresentation(group, value);
                            const isSelected = selectedOptions[group.id] === valueId;

                            return (
                                <button
                                    className={cx(
                                        classes.detailOptionItem,
                                        isSelected && classes.detailOptionItemSelected,
                                        isUnavailable && classes.detailOptionItemUnavailable,
                                        isDisabled && classes.detailOptionItemDisabled,
                                        group.isPlaceholder && classes.detailOptionItemPlaceholder,
                                        !swatchContent && classes.detailOptionItemLabelOnly,
                                    )}
                                    disabled={isDisabled}
                                    key={valueId}
                                    onClick={() => onSelect(group, value)}
                                    type="button"
                                >
                                    {flashSaleOptionUids.has(value.uid) ? (
                                        <img
                                            className={classes.detailOptionFlashSaleIcon}
                                            src="/venia-static-assets/images/flashVariant.svg"
                                            alt="Flash Sale"
                                            width="20"
                                            height="20"
                                        />
                                    ) : null}
                                    {swatchContent?.type === 'image' ? (
                                        <span className={classes.detailOptionImage}>
                                            <img alt={label} src={swatchContent.value} />
                                        </span>
                                    ) : swatchContent?.type === 'color' ? (
                                        <span
                                            className={classes.detailOptionColor}
                                            style={{
                                                backgroundColor: swatchContent.value,
                                            }}
                                        />
                                    ) : swatchContent?.type === 'text' ? (
                                        <span className={classes.detailOptionTextSwatch}>{swatchContent.value}</span>
                                    ) : null}
                                    <span className={classes.detailOptionLabel}>{label}</span>
                                    {stockLabel ? (
                                        <span className={classes.detailOptionBadge}>{stockLabel}</span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </section>
    );
};

export default DetailOptions;
