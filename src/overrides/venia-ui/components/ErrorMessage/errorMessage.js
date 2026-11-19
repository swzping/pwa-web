import React from 'react';
import { node, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './errorMessage.module.css';

const ErrorMessage = React.forwardRef((props, ref) => {
    const { children, success } = props;

    const classes = useStyle(defaultClasses, props.classes);

    const messageStyle = success ? classes.successMessage : classes.errorMessage;

    return (
        <div className={classes.root} ref={ref}>
            <p className={messageStyle}>{children}</p>
        </div>
    );
});

export default ErrorMessage;

ErrorMessage.propTypes = {
    classes: shape({
        root: string,
        errorMessage: string
    }),
    children: node
};
