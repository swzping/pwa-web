import React from 'react';
import classes from './index.module.css';

const Subscribe = () => {
    return (
        <div className={classes.subscribe_container}>
            <div className="row">
                <div className="col-lg-2" />
                <div className="col-lg-10">
                    <p className={classes.title}>
                        Get the latest news and offers. Subscribe to the
                        Guardian's newsletter*.
                    </p>
                </div>
            </div>
            <p className={classes.note}>
                *By clicking the "Subscribe", you agree to Guardian's T&C and
                privacy policy Privacy Policy
            </p>
        </div>
    );
};

export default Subscribe;
