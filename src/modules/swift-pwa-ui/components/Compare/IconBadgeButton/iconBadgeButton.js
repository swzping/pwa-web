import React, { Fragment, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { AlertCircle, Columns as CompareIcon } from 'react-feather';
import { useToasts } from '@magento/peregrine';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Icon from '@magento/venia-ui/lib/components/Icon';

import { useIconBadgeButton } from '../../../../peregrine/talons/Compare/IconBadgeButton/useIconBadgeButton';
import defaultClasses from './iconBadgeButton.module.css';

const ErrorIcon = <Icon size={20} src={AlertCircle} />;

const iconBadgeButton = (props = {}) => {
    const { 
        errorToastProps,
        handleLinkClick, 
        itemCount
    } = useIconBadgeButton();

    const classes = useStyle(defaultClasses, props.classes);
    const [, { addToast }] = useToasts();
    const { formatMessage } = useIntl();
    const buttonAriaLabel = formatMessage(
        {
            id: 'compareIconBadge.ariaLabel',
            defaultMessage:
                'Compare button link. You have {count} items in your compare list.'
        },
        { count: itemCount }
    );
    const itemCountDisplay = itemCount > 99 ? '99+' : itemCount;

    const maybeItemCounter = itemCount ? (
        <span className={classes.counter}>{itemCountDisplay}</span>
    ) : null;

    useEffect(() => {
        if (errorToastProps) {
            addToast({ ...errorToastProps, icon: ErrorIcon });
        }
    }, [addToast, errorToastProps]);
    
    return (
        <Fragment>
            <div className={classes.container}>
                <button
                    aria-label={buttonAriaLabel}
                    className={classes.link}
                    onClick={handleLinkClick}
                >
                    <Icon classes={{ icon: classes.icon }} size={26} src={CompareIcon} />
                    {maybeItemCounter}
                </button>
            </div>
        </Fragment>
    );
};

export default iconBadgeButton;
