import React, { Fragment } from 'react';
import { shape, string } from 'prop-types';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './faq.module.css';

const FaqPageShimmer = props => {
    const classes = useStyle(defaultClasses, props.classes);

    return (
        <Fragment>
            <div
                className={`${
                    classes.image_contact
                } jumbotron text-white jumbotron-image`}
            />
            <div className="container">
                <div className="row mt-5">
                    {Array.from({ length: 5 })
                        .fill(null)
                        .map((item, index) => (
                            <div key={index}>
                                <Shimmer width="100%" />
                            </div>
                        ))}
                    <Shimmer width="80%" />
                </div>
            </div>
        </Fragment>
    );
};

export default FaqPageShimmer;

FaqPageShimmer.propTypes = {
    classes: shape({
        image_contact: string
    })
};
