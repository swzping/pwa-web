import React, { useCallback, useMemo } from 'react';
import { FormattedNumber } from 'react-intl';
import { func, number, shape, string } from 'prop-types';
import { Link } from 'react-router-dom';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import Price from '@magento/venia-ui/lib/components/Price';
import { useStyle } from '@magento/venia-ui/lib/classify';

import Image from '@magento/venia-ui/lib/components/Image';
import defaultClasses from './suggestedProduct.module.css';

const IMAGE_WIDTH = 60;

const SuggestedProduct = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { url_key, small_image, name, onNavigate, price, special_price, price_range, url_suffix } = props;

    const handleClick = useCallback(() => {
        if (typeof onNavigate === 'function') {
            onNavigate();
        }
    }, [onNavigate]);

    const uri = useMemo(() => resourceUrl(`/${url_key}${url_suffix || ''}`), [
        url_key,
        url_suffix
    ]);

    // TODO: 待删除，临时使用 提供视图
    // const special_price = true
    // const percent_off = price_range.maximum_price.discount.percent_off || true

    return (
        <div>
            <Link className={classes.root} to={uri} onClick={handleClick}>
                <Image
                    alt={name}
                    classes={{ image: classes.thumbnail, root: classes.image }}
                    resource={small_image}
                    width={IMAGE_WIDTH}
                />
                <div className={classes.productInfo}>
                    <span className={classes.name}>{name}</span>
                    <span className={classes.priceWrapper}>
                        <span className={classes.price}>
                            <Price
                                currencyCode={price_range.maximum_price.regular_price.currency}
                                value={price_range.minimum_price.final_price.value}
                            />
                        </span>
                        <span className={classes.discountWrapper}>
                            {(price_range && price_range.maximum_price.discount.percent_off && (
                                <>
                                    <span className={classes.discountPrice}>
                                        <Price
                                            value={
                                                price_range.maximum_price.regular_price
                                                    .value
                                            }
                                            currencyCode={
                                                price_range.maximum_price.regular_price
                                                    .currency
                                            }
                                        />
                                    </span>{' '}
                                    <span className={classes.discountValue}>
                                        -
                                        <FormattedNumber
                                            maximumFractionDigits={0}
                                            value={
                                                price_range.maximum_price.discount
                                                    .percent_off
                                            }
                                        />
                                        %
                                    </span>
                                </>
                            )) || null}
                        </span>
                    </span>
                </div>
            </Link>
        </div>
    );
};

SuggestedProduct.propTypes = {
    url_key: string.isRequired,
    small_image: string.isRequired,
    name: string.isRequired,
    onNavigate: func,
    price: shape({
        regularPrice: shape({
            amount: shape({
                currency: string,
                value: number
            })
        })
    }).isRequired,
    classes: shape({
        root: string,
        image: string,
        name: string,
        price: string,
        thumbnail: string
    })
};

export default SuggestedProduct;
