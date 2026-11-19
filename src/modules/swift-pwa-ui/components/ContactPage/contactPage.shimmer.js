import React, { Fragment } from 'react';
import { shape, string, array } from 'prop-types';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './contact.module.css';

const ContactPageShimmer = props => {
    const { items } = props;
    const classes = useStyle(defaultClasses, props.classes);

    const infoContent = items.map((item, index) => (
        <div className="col-sm" key={index}>
            <Shimmer height={10} width="100%" />
        </div>
    ));

    return (
        <Fragment>
            <div
                className={`${
                    classes.image_contact
                } jumbotron text-white jumbotron-image`}
            />
            <div className="container">
                <div className="row mt-5">{infoContent}</div>
            </div>
        </Fragment>
    );
};

export default ContactPageShimmer;

ContactPageShimmer.defaultProps = {
    items: []
};

ContactPageShimmer.propTypes = {
    classes: shape({
        image_contact: string
    }),
    items: array
};
