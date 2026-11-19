import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Rating from 'react-rating';
import { FormattedMessage, useIntl } from 'react-intl';
import Field from '@magento/venia-ui/lib/components/Field';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Select from '@magento/venia-ui/lib/components/Select';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { Message } from '@magento/venia-ui/lib/components/Field';
import { useToasts, useWindowSize } from '@magento/peregrine';
import Button from '@magento/venia-ui/lib/components/Button';
import Pagination from "@magento/venia-ui/lib/components/Pagination";
import { Form } from 'informed';

import { useProductReview } from '../../../peregrine/talons/ProductReview/useProductReview';
import defaultClasses from './productReview.module.css';

const Modal = React.lazy(() => import('./modal'));

const ProductReview = props => {
    const classes = useStyle(defaultClasses);
    const [nickname, setNickname] = useState('');
    const [title, setTitle] = useState('');
    const [review, setReview] = useState('');
    const [rating, setRating] = useState(0);

    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 1024;

    const {
        productReviewData,
        productReviewLoading,
        productReviewError,
        productReviewResponse,
        showModal,
        isModal,
        isDisabled,
        addReviewCalled,
        handleCancel,
        loadMore,
        handleSubmit,
        formErrors,
        pageControl,
    } = useProductReview({
        sku: props.sku,
        id: props.id
    });
    
    const { formatMessage } = useIntl();
    const [, { addToast }] = useToasts();

    const [itemList, setItemList] = useState(productReviewData && productReviewData.items)

    useEffect(() => {
        let list = productReviewData && productReviewData.items.map(v => ({
            ...v,
            timestamp: format(new Date(
                v.created_at.replace(
                    /-/g,
                    '/'
                )
            ),
            'T'),
            rate: v.ratings.length > 0 &&
                v.ratings[0].value
                    ? v.ratings[0].value
                    : 0
        }))
        if (props.filter && props.filter.length) {
            list = list.filter(v => props.filter.includes(v.rate))
        } 
        if (props.sort === 'Recent') {
            list && list.sort(function(a,b){ 
                return b.timestamp - a.timestamp;  
            })
        } else if(props.sort === 'Latest'){
            list && list.sort(function(a,b){ 
                return a.timestamp - b.timestamp;  
            })
        }
        setItemList(list)
    }, [productReviewData, props.sort, props.filter])


    const onSubmit = e => {
        e.preventDefault();
        handleSubmit({
            nickname: nickname,
            title: title,
            rating: rating,
            detail: review
        });

        setNickname('');
        setTitle('');
        setRating('');
        setReview('');
    };

    useEffect(() => {
        if (productReviewResponse && productReviewResponse.message) {
            addToast({
                type: 'info',
                message: formatMessage({
                    id: 'review.success',
                    defaultMessage: 'Review has been sent'
                }),
                timeout: 5000
            });
        }
    }, [addToast, productReviewResponse]);

    const errorMessage = productReviewError ? (
        <div className={`${classes.root} ${classes.layout}`}>
            <Message>
                <FormattedMessage
                    id={'review.errorTryAgain'}
                    defaultMessage={
                        'Something went wrong. Please refresh and try again.'
                    }
                />
            </Message>
        </div>
    ) : null;

    if (productReviewLoading) {
        return (
            <div className={`${classes.root} ${classes.layout}`}>
                <Message>
                    <FormattedMessage
                        id={'review.loading'}
                        defaultMessage={'Loading...'}
                    />
                </Message>
            </div>
        );
    }

    const content = (
        <>
            {/* <section className={classes.titleWrapper}>
                <div>
                    <h3>Customer Reviews</h3>
                    <p>{productReviewData.totalCount || 0} Reviews</p>
                </div>
                <div>
                    <Button
                        disabled={false}
                        onClick={showModal}
                        priority="normal"
                    >
                        <FormattedMessage
                            id={'review.add'}
                            defaultMessage={' Write a Review'}
                        />
                    </Button>
                </div>
            </section> */}
            { itemList && props.seemore && itemList.length >= 3 ? props.seemore : null }
            {itemList && itemList.length ?
                itemList.map((item, index) => (
                    <section className={classes.wrapper} key={index}>
                        <div className={classes.profileWrapper}>
                            <div className={classes.title}>
                                <div className={classes.titleWrapper}>
                                    <p className={classes.titleReview}>
                                        {/* {item.title} */}
                                        {item.nickname || 'Anonim'}
                                    </p>
                                    <p style={{ fontSize: '12px', color: '808080' }}>
                                        {format(
                                            new Date(
                                                item.created_at.replace(
                                                    /-/g,
                                                    '/'
                                                )
                                            ),
                                            'd eee yyyy'
                                        )}
                                    </p>
                                </div>
                                <div className={classes.rateWrapper}>
                                    <Rating
                                        readonly
                                        emptySymbol={
                                            <i
                                                className="fa fa-star"
                                                style={{
                                                    color: '#D6D6D6',
                                                    width: '12px'
                                                }}
                                            />
                                        }
                                        fullSymbol={
                                            <i
                                                className="fa fa-star"
                                                style={{
                                                    color: '#E9D200',
                                                    width: '12px'
                                                }}
                                            />
                                        }
                                        initialRating={
                                            item.ratings.length > 0 &&
                                            item.ratings[0].value
                                                ? item.ratings[0].value
                                                : 0
                                        }
                                    />
                                    <div className={classes.reviewRate}>
                                        {item.rating > 0 && item.rating ? item.rating / 20 : 0} 
                                    </div>
                                </div>
                                {/* <div className={classes.name}>
                                    <strong
                                        style={{
                                            marginRight: '0.5rem',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {item.nickname || 'Anonim'}
                                    </strong>
                                    <p style={{ fontSize: '14px' }}>
                                        {format(
                                            new Date(
                                                item.created_at.replace(
                                                    /-/g,
                                                    '/'
                                                )
                                            ),
                                            'dd/MM/yy'
                                        )}
                                    </p>
                                </div> */}
                            </div>

                            <div className={classes.description}>
                                <span className={classes.detail}>{item.detail || '-'}</span>

                                {/* <div className={classes.showName}>
                                    <strong
                                        style={{
                                            marginRight: '0.5rem',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {item.nickname || 'Anonim'}
                                    </strong>
                                    <p style={{ fontSize: '14px' }}>
                                        {format(
                                            new Date(
                                                item.created_at.replace(
                                                    /-/g,
                                                    '/'
                                                )
                                            ),
                                            'dd/MM/yy'
                                        )}
                                    </p>
                                </div> */}
                            </div>
                        </div>
                    </section>
                )) : 'No data'}
            {productReviewData &&
                productReviewData.totalCount !==
                    productReviewData.items.length ?
                (isMobile ? (
                    <div className={classes.loadMore}>
                        <div className={classes.load} onClick={loadMore}>
                            {productReviewData.totalCount !==
                            productReviewData.items.length ? (
                                <span>Read More Reviews</span>
                            ) : (
                                <span>Back</span>
                            )}
                        </div>
                    </div>
                ) : <div className={classes.pagination}>
                    <Pagination pageControl={pageControl} />
                </div>) : null
            }

            { props.hideReview ? null : <section>
                <form className={classes.form} onSubmit={onSubmit}>
                    <div className={classes.titleReview}>
                        <span>
                            {formatMessage({
                                id: 'titleReview',
                                defaultMessage: "You're Reviewing:"
                            })}
                        </span>
                        <h2>{props.productName || ''}</h2>
                    </div>

                    <div className={classes.titleRating}>
                        <span>
                            {formatMessage({
                                id: 'titleRating',
                                defaultMessage: 'Your Rating'
                            })}
                        </span>
                        <Rating
                            onChange={rate => setRating(rate)}
                            initialRating={rating}
                            emptySymbol={
                                <i
                                    className="fa fa-star fa-2x"
                                    style={{
                                        color: '#D6D6D6'
                                    }}
                                />
                            }
                            fullSymbol={
                                <i
                                    className="fa fa-star fa-2x"
                                    style={{
                                        color: '#E9D200'
                                    }}
                                />
                            }
                        />
                    </div>
                    <input
                        className={classes.input}
                        required
                        placeholder="Nick Name"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                    />
                    <input
                        className={classes.input}
                        required
                        placeholder="Summary"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                    <textarea
                        rows="5"
                        required
                        className={classes.textarea}
                        placeholder="Review"
                        value={review}
                        onChange={e => setReview(e.target.value)}
                    />
                    <Button
                        className={classes.btn}
                        loading={isDisabled}
                        type="submit"
                    >
                        Submit Review
                    </Button>
                </form>
            </section>}

            {/* <Suspense fallback={null}>
                <Modal
                    formErrors={formErrors}
                    isDisabled={isDisabled}
                    isOpen={isModal}
                    onCancel={handleCancel}
                    onSubmit={handleSubmit}
                />
            </Suspense> */}
        </>
    );

    return (
        <div className={classes.root}>
            {errorMessage ? errorMessage : content}
        </div>
    );
};

export default ProductReview;
