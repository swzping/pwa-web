import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './index.module.css';
import { useHistory } from 'react-router-dom';

const CardTitle = ({ name, link, to }) => {
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

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

    return (
        <div className={classes.cardTitle}>
            <span className={classes.cardTitleName}>{name}</span>
            <div className={classes.viewAll} onClick={to}>
                <span>{link}</span>
                <svg
                    style={{ marginLeft: 10 }}
                    xmlns="http://www.w3.org/2000/svg"
                    width="6"
                    height="10"
                    viewBox="0 0 6 10"
                    fill="none"
                >
                    <path
                        d="M0.75 8.75L4.75 4.75L0.75 0.75"
                        stroke="#757575"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </div>
        </div>
    );
};

export default CardTitle;
