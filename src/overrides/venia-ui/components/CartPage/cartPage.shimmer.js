import React from 'react';
import { shape, string } from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import defaultClasses from './cartPage.module.css';

const CartPageShimmer = props => {
    const classes = useStyle(defaultClasses, props.classes);

    return (
        <div className={classes.root} aria-live="polite" aria-busy="true">
            <div className={classes.heading_container}>
                <h1 className={`${classes.heading} hidden-mobile`}>
                    <Shimmer width={12} height={2} key="title" />
                </h1>
                <p className={`${classes.subTitle} hidden-mobile`}>
                    <Shimmer width={6} key="subtitle" />
                </p>

                <div className={`${classes.mobileTitleWrapper} hidden-desktop`}>
                    <div>
                        <Shimmer width={8} key="title-mobile" />
                    </div>
                    <div>
                        <Shimmer width={6} height={2} key="button-mobile" />
                    </div>
                </div>
            </div>
            <div className={`${classes.body} hidden-desktop`}>
                <div className={classes.items_container}>
                    <Shimmer width="100%" key="desc-mobile" />
                </div>
            </div>
            <div className={`${classes.body} hidden-mobile`}>
                <div className={classes.items_container}>
                    <Shimmer width="60%" height={2} key="desc" />
                </div>
            </div>
        </div>
    );
};

export default CartPageShimmer;

CartPageShimmer.propTypes = {
    classes: shape({
        root: string,
        heading_container: string,
        subTitle: string,
        mobileTitleWrapper: string,
        body: string,
        items_container: string
    })
};
