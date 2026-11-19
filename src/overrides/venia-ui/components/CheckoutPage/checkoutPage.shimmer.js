import React, { useState, useEffect } from 'react';
import { shape, string, array } from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import defaultClasses from './checkoutPage.module.css';

const CheckoutPageShimmer = props => {
    const { items } = props;
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);
    const classes = useStyle(defaultClasses, props.classes);

    const resizePhone = () => {
        window.onresize = function() {
            const width = window.innerWidth;
            const newIsPhone = width < 767;
            if (isPhone !== newIsPhone) {
                setIsPhone(newIsPhone);
            }
        };
    };

    useEffect(() => {
        resizePhone();
    }, [isPhone]);

    const checkoutComponents = items.map((item, index) => (
        <div className={classes.shipping_method_container} key={index}>
            <div className={classes.stepper_heading}>
                <h3 className={classes.shipping_method_heading}>
                    <Shimmer width={10} key="name" />
                </h3>
                <span className={classes.shipping_method_subtitle}>
                    <Shimmer width={5} key="subtitle" />
                </span>
            </div>
        </div>
    ));

    return (
        <div className={classes.root} aria-live="polite" aria-busy="true">
            <div
                className={`${classes.checkoutContent} ${
                    isPhone ? 'mt-5' : ''
                }`}
            >
                <div className={classes.heading_container}>
                    <h1 className={classes.heading}>
                        <Shimmer width={20} height={2} key="title" />
                    </h1>
                </div>
                {checkoutComponents}
            </div>
        </div>
    );
};

export default CheckoutPageShimmer;

CheckoutPageShimmer.defaultProps = {
    items: []
};

CheckoutPageShimmer.propTypes = {
    classes: shape({
        root: string,
        checkoutContent: string,
        heading_container: string,
        heading: string,
        shipping_method_container: string,
        stepper_heading: string,
        shipping_method_heading: string,
        shipping_method_subtitle: string
    }),
    items: array
};
