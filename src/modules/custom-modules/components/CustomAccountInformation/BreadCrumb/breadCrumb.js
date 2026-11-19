import React from 'react';
import PropTypes from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { Link, useHistory } from 'react-router-dom';
import { ChevronRightOutlineNotFill } from '@/assets/icons';
import defaultClasses from './breadCrumb.module.css';
const BreadCrumb = props => {
    const { classes: propClasses } = props;
    const classes = useStyle(defaultClasses, propClasses);
    const history = useHistory();

    const CrumbItem = ({ text, onClick, isCurrent, className }) => {
        return (
            <div
                className={className}
                style={{ display: 'flex', alignItems: 'center' }}
            >
                <span
                    onClick={onClick}
                    style={{ cursor: onClick ? 'pointer' : 'default' }}
                >
                    {text}
                </span>

                {!isCurrent && (
                    <ChevronRightOutlineNotFill
                        style={{ fontSize: 14, color: '#969696' }}
                    />
                )}
            </div>
        );
    };

    const navPcList = [
        {
            text: 'My account',
            onClick: () => history.goBack()
        },
        // {
        //     text: 'Pesanan Saya',
        //     onClick: () => history.goBack(),
        //     className: classes.linkItem
        // },
        {
            text: 'My orders',
            isCurrent: true
        }
    ];

    return (
        <div className={classes.root}>
            <div className={classes.breadcrumbWrapper}>
                {navPcList.map((item, index) => {
                    const content = (
                        <CrumbItem {...item} />
                    );

                    return item.isCurrent ? (
                        <div
                            key={index}
                            className={`${classes.link} ${classes.current}`}
                        >
                            {content}
                        </div>
                    ) : (
                        <Link
                            key={index}
                            to={item.path || ''}
                            className={classes.link}
                        >
                            {content}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

BreadCrumb.propTypes = {
    classes: PropTypes.shape({
        root: PropTypes.string,
        breadcrumbWrapper: PropTypes.string,
        linkItem: PropTypes.string,
        current: PropTypes.string,
    }),
};

export default BreadCrumb;
