import React from 'react';
import { shape, string } from 'prop-types';
import { transparentPlaceholder } from '@magento/peregrine/lib/util/images';
import { useStyle } from '@magento/venia-ui/lib/classify';

import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import Image from '@magento/venia-ui/lib/components/Image';
import defaultClasses from './product.module.css';

const IMAGE_SIZE = 100;

const ProductShimmer = props => {
    const classes = useStyle(defaultClasses, props.classes);

    return (
        <>
            <tr className={`${classes.tableData} hidden-mobile`}>
                <td>
                    <Shimmer key="image">
                        <Image
                            alt="Placeholder for gallery item image"
                            classes={{
                                root: classes.imageRoot,
                                image: classes.image
                            }}
                            width={IMAGE_SIZE}
                            src={transparentPlaceholder}
                        />
                    </Shimmer>
                </td>

                <td className={classes.tableDataName}>
                    <Shimmer width={10} key="name" />
                </td>
                <td style={{ textAlign: 'center' }}>
                    <Shimmer width={5} key="price" />
                </td>
                <td style={{ textAlign: 'center' }}>
                    <Shimmer width={5} key="qty" />
                </td>
                <td style={{ textAlign: 'center' }}>
                    <Shimmer width={5} key="total" />
                </td>
                <td className={classes.tableEdit}>
                    <div className={classes.editWrapper}>
                        <Shimmer width={5} key="button" />
                    </div>
                </td>
            </tr>

            <li className={`${classes.root} hidden-sm`}>
                <div className={classes.item}>
                    <Shimmer key="image-mobile">
                        <Image
                            alt="Placeholder for gallery item image"
                            classes={{
                                root: classes.imageRoot,
                                image: classes.image
                            }}
                            width={IMAGE_SIZE}
                            src={transparentPlaceholder}
                        />
                    </Shimmer>
                    <div className={classes.details}>
                        <div className={classes.name}>
                            <Shimmer width="100%" key="name-mobile" />
                        </div>
                        <div className={classes.quantity}>
                            <Shimmer width={5} key="quantity-mobile" />
                        </div>
                        <span className={classes.price}>
                            <Shimmer width={10} key="price-mobile" />
                        </span>
                    </div>
                </div>
            </li>
        </>
    );
};

ProductShimmer.propTypes = {
    classes: shape({
        root: string,
        tableData: string,
        tableDataName: string,
        tableEdit: string,
        editWrapper: string,
        item: string,
        details: string,
        name: string,
        quantity: string,
        price: string
    })
};

export default ProductShimmer;
