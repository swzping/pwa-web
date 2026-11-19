import React, { useEffect, useContext, useState } from 'react';
import { bool, func, shape, string, object, node, number } from 'prop-types';
import { ChevronLeft, X, ChevronDown, Check, Filter } from 'react-feather';
import Rating from 'react-rating';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import defaultClasses from './productReviewDetail.module.css';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import ProductReview from '../ProductReview';
import Popup from '../Popup'

const ProductReviewDetail = props => {
    const classes = useStyle(defaultClasses);

    const { setNavConfig } = useContext(HeaderContext);
    const {
        isOpen,
        onBack,
        productDetails,
    } = props

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
        } else {
            document.body.style.overflow = 'auto';
            document.body.style.position = 'static';
        }
    }, [isOpen]);


    useEffect(() => {
        setNavConfig({
            headerTitle: 'PRODUCT REVIEW',
            useCart: false
        });
    }, []);


    // const DrawerWrapper = props => {
    //     return props.show ? <div className={classes.drawerWrapper}>
    //         <div className={classes.drawerContainer}>
    //             <div className={classes.drawerHeader}>
    //                 {props.title}
    //                 <div className={classes.dricon} onClick={() => props.onClose()}>
    //                     <X />
    //                 </div>
    //             </div>
    //             <div className={classes.drawerContent}>
    //                 {props.children}
    //             </div>
    //         </div>
    //     </div> : null
    // }

    const sortOptions = ['Recent', 'Latest'];
    const [show, setShow] = useState(false)
    const [sort, setSort] = useState('Recent')

    const SortDrawer = () => {
        return <Popup
            isOpen={show}
            closeable={true}
            onClose={() => setShow(false)}
            title='Sorting'
            position="bottom"
        >
            {sortOptions.map((v) => {
                const className = sort === v ? `${classes.itemActive} ${classes.item}` : classes.item
                return <div className={className} key={v} onClick={() => {
                    setSort(v)
                    setShow(false)
                }}>
                    {v}{sort === v ? <Check></Check> : null}
                </div>
            })}
        </Popup>
    }


    const filterOptions = [5, 4, 3, 2, 1];
    const [showF, setShowF] = useState(false)
    const [filter, setFilter] = useState([])

    const FilterDrawer = () => {
        const [active, setActive] = useState(filter)

        return <Popup
            isOpen={showF}
            closeable={true}
            onClose={() => setShowF(false)}
            title='Filter'
            position="bottom"
        >
            {filterOptions.map((v) => {
                const className = active.includes(v) ? `${classes.itemActive} ${classes.item}` : classes.item
                return <div className={className} key={v} onClick={() => {
                    if (active.includes(v)) {
                        setActive(prev => prev.filter(_v => _v !== v))
                    } else {
                        setActive(prev => prev.concat(v))
                    }
                }}>
                    <div className={classes.filterItem}>
                        <div className={classes.filterCheck}>
                            <Check size="14"></Check>
                        </div>
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
                            initialRating={v}
                        />
                        <div style={{marginLeft: '8px', color: '#000'}}>{v}</div>
                    </div>
                </div>
            })}
            <div className={classes.filterBtnContent}>
                <div className={classes.clearBtn} onClick={() => {
                    setFilter([])
                    setShowF(false)
                }}>
                    Clear All
                </div>
                <div className={classes.applyBtn} onClick={() => {
                    setFilter(active)
                    setShowF(false)
                }}>
                    Apply
                </div>
            </div>
        </Popup>
    }

    return (
        isOpen ? <div className={classes.root}>
            <div className={classes.header}>
                <div className={classes.icon} onClick={onBack}>
                    <ChevronLeft/>
                </div>
                Reviews({productDetails.reviews })
            </div>
            <SortDrawer></SortDrawer>
            <FilterDrawer></FilterDrawer>
            <div className={classes.opcontent}>
                <div className={classes.sort} onClick={() => setShow(true)}>
                    Sort:{sort} <ChevronDown size="10" />
                </div>
                <div className={classes.filterWrapper} onClick={() => setShowF(true)}>
                    {/* {filter ? <div className={classes.filterShow}>
                        Filter:{filter} <ChevronDown size="10" />
                    </div> : null } */}
                    <div className={classes.filterBtn}>
                        <Filter size="14" /> Filter
                    </div>
                </div>
            </div>
            <div className={classes.content}>
                <ProductReview {...productDetails} sort={sort} filter={filter} hideReview={true}></ProductReview>
            </div>
        </div> : null
    )

};

export default ProductReviewDetail;


ProductReviewDetail.propTypes = {
    isOpen: bool,
    onBack: func,
    productDetails: object,
};

ProductReviewDetail.defaultProps = {
    isOpen: false,
    reviewNum: 0
};
