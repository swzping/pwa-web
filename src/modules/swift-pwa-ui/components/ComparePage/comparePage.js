import React from 'react';
import { X } from 'react-feather';
import { useIntl } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import Icon from '@magento/venia-ui/lib/components/Icon';
import ProductItem from '@magento/venia-ui/lib/components/Gallery/item';
// import ConfirmationDelete from '@core_modules/cart/pages/default/components/confirmDelete';

import { useComparePage } from '../../../peregrine/talons/ComparePage/useComparePage';
import compClasses from './comparePage.module.css';
import ComparePageEmpty from './comparePage.empty';

const ClearIcon = (props) => <Icon classes={{ icon: compClasses.clear_icon }} src={X} {...props} />;

const ComparePage = () => {
    const classes = useStyle(compClasses);
    const { formatMessage } = useIntl();
    const { 
        columnWidth,
        compareListData,
        error,
        handleDeleteCompare, 
        loading,
    } = useComparePage();

    if (loading && !error) {
        return fullPageLoadingIndicator;
    }

    if (!loading && (!compareListData.items || compareListData.items.length <= 0)) {
        return <ComparePageEmpty />;
    }

    return (
        <div>
            <h1 className={classes.title} align="left">
                {formatMessage({
                    id: 'comparePage.title',
                    defaultMessage: 'Product Compare'
                })}
            </h1>
            <div className={classes.container}>
                <div className={classes.table_container}>
                    <table>
                        <thead>
                            <tr tabIndex={-1}>
                                <th className={`hidden-mobile ${classes.sticky_column}`} style={{ width: columnWidth }}>
                                    {' '}
                                </th>
                                {compareListData.items && compareListData.items.map((productCompare) => {
                                    const { product, uid } = productCompare;
                                    return (
                                        <th
                                            align="center"
                                            className={`${classes.column} ${classes.product_column}`}
                                            key={`product-${uid}`}
                                            style={{ width: columnWidth }}
                                        >
                                            <div className={classes.product_image}>
                                                <ProductItem item={product} disableAddToCart />
                                                <ClearIcon onClick={() => handleDeleteCompare(uid)} />
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className={classes.table_body}>
                            <tr>
                                <td className={`hidden-mobile ${classes.sticky_column}`} style={{ width: columnWidth }}>
                                    <span style={{ width: columnWidth, textTransform: 'uppercase' }}>
                                        {formatMessage({
                                            id: 'comparePage.label.sku',
                                            defaultMessage: 'SKU'
                                        })}
                                    </span>
                                </td>
                                {compareListData.items && compareListData.items.map((productCompare) => {
                                    const { product, uid } = productCompare;
                                    return (
                                        <td
                                            className={classes.column}
                                            key={`product-${uid}-sku`}
                                            style={{ width: columnWidth }}
                                        >
                                            <p className={`hidden-desktop ${classes.column__title} ${classes.sku}`}>
                                                {formatMessage({
                                                    id: 'comparePage.label.sku',
                                                    defaultMessage: 'SKU'
                                                })}
                                            </p>
                                            {product.sku}
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr>
                                <td className={`hidden-mobile ${classes.sticky_column}`} style={{ width: columnWidth }}>
                                    {formatMessage({
                                        id: 'comparePage.label.description',
                                        defaultMessage: 'Description'
                                    })}
                                </td>
                                {compareListData.items && compareListData.items.map((productCompare) => {
                                    const { product, uid } = productCompare;
                                    return (
                                        <td
                                            className={classes.column}
                                            key={`product-${uid}-description`}
                                            style={{ width: columnWidth }}
                                        >
                                            <p className={`hidden-desktop ${classes.column__title}`}>
                                                {formatMessage({
                                                    id: 'comparePage.label.description',
                                                    defaultMessage: 'Description'
                                                })}
                                            </p>
                                            <div
                                                className="description_item"
                                                style={{ width: columnWidth }}
                                                dangerouslySetInnerHTML={{ __html: product.description.html }}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr>
                                <td className={`hidden-mobile ${classes.sticky_column}`} style={{ width: columnWidth }}>
                                    {formatMessage({
                                        id: 'comparePage.label.shortDescription',
                                        defaultMessage: 'Short Description'
                                    })}
                                </td>
                                {compareListData.items && compareListData.items.map((productCompare) => {
                                    const { product, uid } = productCompare;
                                    return (
                                        <td
                                            className={classes.column}
                                            key={`product-${uid}-shortDescription`}
                                            style={{ width: columnWidth }}
                                        >
                                            <p className={`hidden-desktop ${classes.column__title}`}>
                                                {formatMessage({
                                                    id: 'comparePage.label.shortDescription',
                                                    defaultMessage: 'Short Description'
                                                })}
                                            </p>
                                            <div dangerouslySetInnerHTML={{ __html: product.short_description.html }} />
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr>
                                <td className={`hidden-mobile ${classes.sticky_column}`} style={{ width: columnWidth }}>
                                    {formatMessage({
                                        id: 'comparePage.label.brand',
                                        defaultMessage: 'Brand'
                                    })}
                                </td>
                                {compareListData.items && compareListData.items.map(({ uid }) => (
                                    <td
                                        className={classes.column}
                                        key={`product-${uid}-brand`}
                                        style={{ width: columnWidth }}
                                    >
                                        <p className={`hidden-desktop ${classes.column__title}`}>
                                            {formatMessage({
                                                id: 'comparePage.label.brand',
                                                defaultMessage: 'Brand'
                                            })}
                                        </p>{' '}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* <ConfirmationDelete t={t} open={confirmDel} handleDelete={handleDelete} handleCancel={cancelDelete} /> */}
            </div>
        </div>
    );
};

export default ComparePage;