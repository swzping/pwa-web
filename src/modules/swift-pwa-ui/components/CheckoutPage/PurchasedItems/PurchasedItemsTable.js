import React from 'react';
import { useCartFlashSale } from '../../../../../helpers/useCartFlashSale';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Link } from 'react-router-dom';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import Price from '@magento/venia-ui/lib/components/Price';
import ProductOptions from '@magento/venia-ui/lib/components/LegacyMiniCart/productOptions';
import ProductBadges from '../../Gallery/productBadges';
import classes from './PurchasedItemsTable.module.css';
import shouldShowCartItemVariant from '../../../../../helpers/shouldShowCartItemVariant';

const IMAGE_SIZE = 100;

const PurchasedItemsTable = ({ item, displaySubtotalLoaderId, displayRemoveLoaderId }) => {
    const {
        currency,
        image,
        name,
        optionText,
        quantity,
        stockStatus,
        stockItem,
        unitPrice,
        urlKey,
        urlSuffix,
        customCartDiscount,
        promo,
        is_free_gift,
        is_gamification_free_gift
    } = item;

    const { is_flash_sale, hours, minutes, seconds, isFinished } = useCartFlashSale(item);

    const itemLink = resourceUrl(`/${urlKey}${urlSuffix || ''}`);

    const discountAmount = customCartDiscount && customCartDiscount.find(x => x.promo_id === "special_price")?.discount_amount;
    const regularPrice = discountAmount ? unitPrice + discountAmount : null;

    const customizableOptions =
        item.customizable_options && item.customizable_options.length > 0 ? (
            <>
                {item.customizable_options.map((item, index) => (
                    <div key={index}>
                        <span>
                            <span className={classes.customizableTitle}>
                                {item.label}:
                            </span>{' '}
                            {item.values.map(item => item.label).join(', ')}
                        </span>
                    </div>
                ))}
            </>
        ) : null;

    const bundleOptions =
        item.bundle_options && item.bundle_options.length > 0 ? (
            <div className={classes.customizable}>
                {item.bundle_options.map((val, idx) => (
                    <div key={idx}>
                        <span className={classes.customizableTitle}>
                            {val.label}
                        </span>{' '}
                        :
                        <div>
                            {val.values.map((item, idt) => (
                                <div style={{ fontSize: '12px' }} key={idt}>
                                    {item.label}
                                    {' + '}
                                    <strong>
                                        <Price
                                            currencyCode={currency}
                                            value={item.price}
                                        />
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : null;

    return (
        <>
            <tr className={`${classes.tableData} ${is_free_gift || is_gamification_free_gift ? classes.freeGift : ''}`} id="showTableData">
                {displayRemoveLoaderId === item.id ?
                    <div className={classes.removeLoader}>
                        <span className={classes.loader}></span>
                        <span className={classes.loaderText}>Remove Item...</span>
                    </div>
                    : null
                }
                <td className={classes.tableImageCell}>
                    <Link to={itemLink} className={classes.imageContainer}>
                        {is_flash_sale === 1 && !isFinished && <img style={{ position: 'absolute', zIndex: 1, width: 28, top: 4, left: 4 }} src='/venia-static-assets/images/flashProduct.png' />}
                        <img
                            alt={name}
                            className={`${classes.imageRoot} ${classes.image}`}
                            width={IMAGE_SIZE}
                            src={image.url}
                        />
                        {promo && promo.length && (
                            <div className={classes.productPromo}>{promo}</div>
                        )}
                        {stockStatus === 'OUT_OF_STOCK' && <div className={classes.outOfStock}>Out of Stock</div>}
                    </Link>
                    {is_flash_sale === 1 && !isFinished && <div className={classes.endsStyle}>Ends in {hours} : {minutes} : {seconds}</div>}
                </td>
                <td className={classes.tableDataName}>
                    <Link className={classes.nameLink} to={itemLink}>
                        {name}
                    </Link>
                    {shouldShowCartItemVariant(item) && optionText ? (
                        <div className={classes.optionText}>{optionText}</div>
                    ) : null}
                    {stockStatus === 'OUT_OF_STOCK' ?
                        <div className={classes.stockStatus}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                            </svg>
                            <span>Out of stock</span>
                        </div>
                        : null
                    }
                    {stockItem?.salable_qty < quantity && stockItem?.salable_qty != 0 ?
                        <div className={classes.qtyStatus}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                            </svg>
                            <span>Unavailable Qty</span>
                        </div>
                        : null
                    }
                    {customizableOptions}
                    {bundleOptions}
                </td>
                <td className={classes.tablePriceCell}>
                    {is_free_gift || is_gamification_free_gift ? <ProductBadges badges={[{ promotion_type: 'Free Gift', name: 'Free Gift' }]} /> : (
                        customCartDiscount.some(i => i.promo_id === "special_price") ?
                            <div className={`${classes.priceWrapper} ${classes.specialPrice}`} style={{ fontWeight: 700 }}>
                                <Price
                                    currencyCode={currency}
                                    value={unitPrice}
                                />
                                {!(is_free_gift || is_gamification_free_gift) && <div style={{ display: 'block'}}>
                                        <ProductBadges style={{ display: 'flex', flexDirection: 'column' }} badges={item?.validOffers} productLink={itemLink} />
                                    </div>}
                                {
                                    !isFinished && <div className={classes.discountWrapper}>
                                        {regularPrice && (
                                            <>
                                                <span className={classes.discountPrice}>
                                                    <Price
                                                        currencyCode={currency}
                                                        value={regularPrice}
                                                    />
                                                </span>
                                                <span className={classes.discountValue}>
                                                    -
                                                    <FormattedNumber
                                                        maximumFractionDigits={0}
                                                        value={
                                                            (discountAmount / regularPrice) * 100
                                                        }
                                                    />
                                                    %
                                                </span>
                                            </>
                                        )}
                                </div>
                            }
                        </div>
                        : <div style={{ fontWeight: 700 }}>
                            <Price currencyCode={currency} value={unitPrice} />
                            {!(is_free_gift || is_gamification_free_gift) && <ProductBadges badges={item?.validOffers} productLink={itemLink} />}
                        </div>
                )}
                </td>
                <td className={classes.tableQuantityCell}>
                    {is_free_gift || is_gamification_free_gift ? `Qty x${quantity}` : `Qty x${quantity}`}
                </td>
                <td className={classes.tableDataTotalPrice}>
                    {(displaySubtotalLoaderId === item.id) ?
                        <div className={classes.loaderWrapper}>
                            <span className={classes.loader}></span>
                            <span className={classes.loaderText}>Loading...</span>
                        </div>
                        : <>
                            <span className={classes.totalPriceValue}>
                                {customCartDiscount.some(i => i.promo_id === "special_price") ?
                                    <Price currencyCode={currency} value={unitPrice * quantity} />
                                    : <Price currencyCode={currency} value={unitPrice * quantity} />
                                }
                            </span>
                        </>
                    }
                </td>
            </tr>
        </>
    );
};

export default PurchasedItemsTable;
