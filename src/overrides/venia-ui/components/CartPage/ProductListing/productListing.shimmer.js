import React from 'react';
import { shape, string, array, object } from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import ProductShimmer from './product.shimmer';
import defaultClasses from './productListing.module.css';

const ProductListingShimmer = props => {
    const { items, itemProps } = props;
    const classes = useStyle(defaultClasses, props.classes);

    const productComponents = items.map((item, index) => (
        <ProductShimmer key={index} {...itemProps} />
    ));

    return (
        <div aria-live="polite" aria-busy="true">
            <ul className={`${classes.root} hidden-sm`}>{productComponents}</ul>

            <table style={{ width: '100%' }} className="hidden-mobile">
                <thead>
                    <tr className={classes.tableHeader}>
                        <th>
                            <Shimmer width="100%" key="product-name" />
                        </th>
                        <th />
                        <th style={{ textAlign: 'center' }}>
                            <Shimmer width="80%" key="product-price" />
                        </th>
                        <th style={{ textAlign: 'center' }}>
                            <Shimmer width="80%" key="product-qty" />
                        </th>
                        <th style={{ textAlign: 'center' }}>
                            <Shimmer width="80%" key="product-subtotal" />
                        </th>
                        <th />
                    </tr>
                </thead>
                <tbody>{productComponents}</tbody>
            </table>
        </div>
    );
};

export default ProductListingShimmer;

ProductListingShimmer.defaultProps = {
    items: [],
    itemProps: {}
};

ProductListingShimmer.propTypes = {
    classes: shape({
        root: string,
        tableHeader: string
    }),
    items: array,
    itemProps: shape({
        classes: object
    })
};
