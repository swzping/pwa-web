import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '../thanks.module.css';
import Button from '@magento/venia-ui/lib/components/Button';

const FailedPage = ({ data, handleReorder, snapStatus }) => {
    const classes = useStyle(defaultClasses);
    return (
        <div className={classes.root}>
            <div
                className={`jumbotron text-white jumbotron-image ${
                    classes.image
                }`}
            >
                <h2>Your Order Was Failed</h2>
            </div>
            <div className={classes.wrapper}>
                <center>
                    <div>
                        <span className={classes.name}>You order number is</span>
                        <h2 className={classes.textNumber}>
                            #{data.order_number}
                        </h2>
                    </div>
                    <div className={`${classes.desc}`}>
                        <span>Customer Cancel Transaction</span>
                        {/* <Link to="/" className={classes.textLink}>
                            Check your order status here
                        </Link> */}
                    </div>
                    <Button
                        priority="high"
                        type="button"
                        className={classes.btn}
                        loading={snapStatus.loading}
                        onClick={handleReorder}
                    >
                        <span>Reorder</span>
                    </Button>
                </center>
            </div>
        </div>
    );
};

export default FailedPage;
