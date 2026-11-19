import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './remark.module.css';

export const Remark = () => {
    const classes = useStyle(defaultClasses);
    return (
        <div className={classes.remark}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
            >
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10ZM10 11C9.44772 11 9 10.5523 9 10V6C9 5.44772 9.44772 5 10 5C10.5523 5 11 5.44772 11 6V10C11 10.5523 10.5523 11 10 11ZM9 14C9 14.5523 9.44772 15 10 15C10.5523 15 11 14.5523 11 14C11 13.4477 10.5523 13 10 13C9.44772 13 9 13.4477 9 14Z"
                    fill="white"
                />
            </svg>
            <span className={classes.remarkText}>
                Very sorry！We are temporarily out of stock. <br />More inventory is
                expected soon
            </span>
        </div>
    );
};
