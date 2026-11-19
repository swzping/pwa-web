import React, { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { func, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import defaultClasses from './errorView.module.css';
// import backgroundUrl from './errorViewBackground-1400x600.png';
// import mobileBackgroundUrl from './errorViewBackground-380x600.png';

const DEFAULT_HEADER = 'Ooops!';
// const DEFAULT_MESSAGE = 'Looks like something went wrong. Sorry about that.';
const DEFAULT_MESSAGE = 'Maaf, halaman yang anda cari tidak di temukan.';
// const DEFAULT_PROMPT = 'Take me home';
const DEFAULT_PROMPT = 'Back to Homepage';
const DEFAULT_PAGENOTFOUND = 'PAGE NOT FOUND';

const ErrorView = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const history = useHistory();

    const handleGoHome = useCallback(() => {
        history.push('/');
    }, [history]);

    const {
        header = (
            <FormattedMessage
                id={'errorView.customheader'}
                defaultMessage={DEFAULT_HEADER}
            />
        ),
        message = (
            <FormattedMessage
                id={'errorView.custommessage'}
                defaultMessage={DEFAULT_MESSAGE}
            />
        ),
        buttonPrompt = (
            <FormattedMessage
                id={'errorView.customgoHome'}
                defaultMessage={DEFAULT_PROMPT}
            />
        ),
        onClick = handleGoHome
    } = props;

    const pageNotFound = (
        <FormattedMessage
            id={'errorView.customPageNotFount'}
            defaultMessage={DEFAULT_PAGENOTFOUND}
        />
    );

    const handleClick = useCallback(() => {
        onClick && onClick();
    }, [onClick]);

    // const style = {
    //     '--backroundImageUrl': `url("${backgroundUrl}")`,
    //     '--mobileBackgroundImageUrl': `url("${mobileBackgroundUrl}")`
    // };

    return (
        <div className={classes.root}>
            <div className={classes.content}>
                <p className={classes.header}>{header}</p>
                <p className={classes.pageNotFound}>{pageNotFound}</p>
                <p className={classes.message}>{message}</p>
                <div className={classes.actionsContainer}>
                    <Button
                        className={classes.buttonToHome}
                        priority="high"
                        type="button"
                        onClick={handleClick}
                    >
                        {buttonPrompt}
                    </Button>
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
