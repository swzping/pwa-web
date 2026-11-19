import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './labelPromotion.module.css';

const LabelPromotion = ({ label }) => {
    const classes = useStyle(defaultClasses);
    const arrayString = label.split(' ');
    const secondWord = arrayString.filter((word, index) => index !== 0).join(' ');

    return (
        <div className={classes.wrapperPromoLabel}>
            <p className={classes.firstText}>
                {arrayString[0]}
            </p>
            <p className={classes.secondText}>
                {secondWord}
            </p>
        </div>
    );
};

export default LabelPromotion;
