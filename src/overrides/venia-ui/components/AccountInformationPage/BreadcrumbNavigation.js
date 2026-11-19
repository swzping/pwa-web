import React from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './breadcrumbNavigation.module.css';

const BreadcrumbNavigation = ({ orderId }) => {
    const classes = useStyle(defaultClasses);
    const location = useLocation();
    const history = useHistory();
    
    const handlePesananSayaClick = () => {
        history.push(`/account-information?orderId=${orderId}`);
    };
    
    const getBreadcrumbItems = () => {
        if (location.pathname.includes('/account-information/order/') && orderId) {
            return [
                { label: 'My account', path: '/account-information' },
                { label: 'Pesanan Saya', onClick: handlePesananSayaClick, isClickable: true },
                { label: 'Delivery details', path: null, isCurrent: true }
            ];
        } else {
            return [];
        }
    };

    const breadcrumbItems = getBreadcrumbItems();

    return (
        <div className={classes.root}>
            {breadcrumbItems.map((item, index) => (
                <React.Fragment key={index}>
                    {item.path ? (
                        <Link 
                            to={item.path} 
                            className={`${classes.link} ${item.isCurrent ? classes.current : ''}`}
                        >
                            {item.label}
                        </Link>
                    ) : item.isClickable ? (
                        <button
                            onClick={item.onClick}
                            className={`${classes.link} ${classes.clickableButton}`}
                        >
                            {item.label}
                        </button>
                    ) : (
                        <span 
                            className={`${classes.text} ${item.isCurrent ? classes.current : ''}`}
                        >
                            {item.label}
                        </span>
                    )}
                    {index < breadcrumbItems.length - 1 && (
                        <span className={classes.separator}>&gt;</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default BreadcrumbNavigation;