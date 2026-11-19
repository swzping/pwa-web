import React, { useEffect, useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import { useProductReviewPage } from '../../../peregrine/talons/ProductReviewPage/useProductReview';
import defaultClasses from './productReviewPage.module.css';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { storeCreditDateFormat } from '../../../peregrine/hooks/storeCreditDateFormat';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';

const ProductReviewPage = props => {
    const classes = useStyle(defaultClasses);
    const {
        productReviewData,
        productReviewError,
        productReviewLoading,
        reviewCustomer,
        errorMessage
    } = useProductReviewPage();
    const { setNavConfig } = useContext(HeaderContext);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'PRODUCT REVIEW',
            useCart: false
        });
    }, []);

    if (productReviewLoading) {
        // return fullPageLoadingIndicator;
        return (
            <div className={classes.root}>
                <div className={classes.title}>
                    <Shimmer height="20px" width="220px" />
                </div>
                <div>
                    <table className={classes.table}>
                        <thead className={classes.tableHeader}>
                            <tr>
                                <th>
                                    <Shimmer height="30px" width="100%" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <Shimmer height="20px" width="100%" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    if (productReviewError) {
        return <ErrorView message={errorMessage} />;
    }

    return (
        <div className={classes.root}>
            <div className={classes.mobileRoot}>
                <div className={classes.mobileMainWrapper}>
                    <p className={classes.mobileCurrentBalanceText}>
                        My Product Reviews
                    </p>
                </div>

                {
                    reviewCustomer && reviewCustomer.items.length > 0 ? (
                        <>
                            {
                                reviewCustomer.items.map((val, id) => (
                                    <div key={id} className={classes.mobileWrapper}>
                                        <div className={classes.mobileContent}>
                                            <div className={classes.mobileSingleWrapper}>
                                                <p className={classes.infoMobileTitle}>product name</p>
                                                <p className={classes.infoMobileText}>
                                                    {val.product.name}
                                                </p>
                                            </div>
                                            <div className={classes.mobileInfoWrapper}>
                                                <div>
                                                    <p className={classes.infoMobileTitle}>created</p>
                                                    <p className={classes.infoMobileText}>
                                                        {
                                                            storeCreditDateFormat(val.created_at)
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={classes.infoMobileTitle}>rating</p>
                                                    <p className={classes.infoMobileText}>
                                                        {
                                                            val.ratings_breakdown.length > 0
                                                            ? val.ratings_breakdown[0].value
                                                            : 0
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className={classes.infoMobileText}>
                                                    {val.text}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </>
                    ) : (
                        <p className={classes.mobileNoData}>No Product Review Data</p>
                    )
                }
            </div>
            <div className={classes.title}>
                <p>My Product Reviews</p>
            </div>
            <div>
                <table className={classes.table}>
                    <thead className={classes.tableHeader}>
                        <tr>
                            <th>Created</th>
                            <th>Product Name</th>
                            <th>Rating</th>
                            <th>Review</th>
                        </tr>
                    </thead>
                    {reviewCustomer && reviewCustomer.items.length > 0 ? (
                        <tbody>
                            {reviewCustomer.items.map((val, id) => (
                                <tr key={id}>
                                    <td>{storeCreditDateFormat(val.created_at)}</td>
                                    <td>{val.product.name}</td>
                                    <td>
                                        {val.ratings_breakdown.length > 0
                                            ? val.ratings_breakdown[0].value
                                            : 0}
                                    </td>
                                    <td>{val.text}</td>
                                </tr>
                            ))}
                        </tbody>
                    ) : (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center' }}>
                                <p>No Product Review Data</p>
                            </td>
                        </tr>
                    )}
                </table>
            </div>
        </div>
    );
};

export default ProductReviewPage;
