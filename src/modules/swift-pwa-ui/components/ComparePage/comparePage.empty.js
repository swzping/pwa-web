import React from 'react';
import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';

const ComparePageEmpty = () => {
    const classes = useStyle();
    const { formatMessage } = useIntl();
    
    return (
        <div className={`${classes.container} pt-5 row text-center`}>
            <div className="col-xs-12">
                <span>
                    {formatMessage({
                        id: 'comparePage.titleEmpty',
                        defaultMessage: 'Your product compare list is empty'
                    })}
                </span>
            </div>
            <div className={`col-xs-12`}>
                <Link to="/">
                    {formatMessage({
                        id: 'comparePage.buttonEmpty',
                        defaultMessage: 'Find Product to Compare'
                    })}
                </Link>
            </div>

        </div>
    );
};

export default ComparePageEmpty;
