import React, { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { func, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import defaultClasses from './renderErrorView.module.css';

const DEFAULT_HEADER = 'Ooops!';

const ErrorView = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const history = useHistory();

    const onRefreshPage = () => {
        location.reload();
    };

    const {
        header = (
            <FormattedMessage
                id={'errorView.customheader'}
                defaultMessage={DEFAULT_HEADER}
            />
        ),
        title = 'Something went wrong',
        content = 'We’re having trouble loading this page or file. This might be a temporary connection issue or a system error.',
        showHomeButton = true,
        showRefreshButton = true,
        returnHomePage = () => {}
    } = props;

    return (
        <div className={classes.root}>
            <div className={classes.content}>
                <p className={classes.header}>{header}</p>
                <p className={classes.pageNotFound}>{title}</p>
                <p className={classes.message}>{content}</p>
                <div className={classes.actionsContainer}>
                    {showRefreshButton ? (
                        <Button
                            className={classes.buttonRefresh}
                            priority="normal"
                            type="button"
                            onClick={onRefreshPage}
                        >
                            Refresh Page
                        </Button>
                    ) : null}
                    {showHomeButton ? (
                        <Button
                            className={classes.buttonToHome}
                            priority="high"
                            type="button"
                            onClick={returnHomePage}
                        >
                            Back to Dashboard
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

ErrorView.propTypes = {
    header: string,
    message: string,
    buttonPrompt: string,
    onClick: func,
    classes: shape({
        root: string,
        content: string,
        errorCode: string,
        header: string,
        message: string,
        actionsContainer: string
    })
};

export default ErrorView;
