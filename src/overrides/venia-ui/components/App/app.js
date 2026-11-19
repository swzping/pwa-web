import React, { useCallback, Suspense } from 'react';
import { useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';
import { array, func, shape, string } from 'prop-types';
import { useLocation } from 'react-router-dom';

import { useToasts } from '@magento/peregrine';
import { useApp } from '@magento/peregrine/lib/talons/App/useApp';

import globalCSS from '@magento/venia-ui/lib/index.module.css';
import {
    HeadProvider,
    StoreTitle
} from '@magento/venia-ui/lib/components/Head';
import Main from '@magento/venia-ui/lib/components/Main';
import Mask from '@magento/venia-ui/lib/components/Mask';
import Routes from '@magento/venia-ui/lib/components/Routes';
import ToastContainer from '@magento/venia-ui/lib/components/ToastContainer';
import Icon from '@magento/venia-ui/lib/components/Icon';
import HeaderContextProvider from '../../../peregrine/context/header';
import PreviewPDF from '@/modules/custom-modules/components/PreviewPDF/index';

import {
    AlertCircle as AlertCircleIcon,
    CloudOff as CloudOffIcon,
    Wifi as WifiIcon
} from 'react-feather';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.module.css';

import DEFAULT_OPERATIONS from '../../../peregrine/talons/App/app.gql';

const Navigation = React.lazy(() =>
    import('@magento/venia-ui/lib/components/Navigation')
);

import TagManager from 'react-gtm-module';
import ReactPixel from 'react-facebook-pixel';

const OnlineIcon = <Icon src={WifiIcon} attrs={{ width: 18 }} />;
const OfflineIcon = <Icon src={CloudOffIcon} attrs={{ width: 18 }} />;
const ErrorIcon = <Icon src={AlertCircleIcon} attrs={{ width: 18 }} />;

const App = props => {
    const { markErrorHandled, renderError, unhandledErrors } = props;
    const { formatMessage } = useIntl();
    const [, { addToast }] = useToasts();
    const { pathname } = useLocation();

    const ERROR_MESSAGE = formatMessage({
        id: 'app.errorUnexpected',
        defaultMessage: 'Sorry! An unexpected error occurred.'
    });

    React.useEffect(() => {
        /* initial gtm */
        if (process.env.ENABLE_TRACKING_GTM) {
            console.log('initialize');
            const tagManagerArgs = {
                gtmId: process.env.GTM_ID
            };

            TagManager.initialize(tagManagerArgs);
        }
        /* initial fb pixel */
        if (
            process.env.FACEBOOK_PIXEL_ENABLE === 'true' &&
            process.env.FACEBOOK_PIXEL_ID
        ) {
            ReactPixel.init(process.env.FACEBOOK_PIXEL_ID); // facebookPixelId
            ReactPixel.pageView();
        }
    }, []);

    const handleIsOffline = useCallback(() => {
        addToast({
            type: 'error',
            icon: OfflineIcon,
            message: formatMessage({
                id: 'app.errorOffline',
                defaultMessage:
                    'You are offline. Some features may be unavailable.'
            }),
            timeout: 3000
        });
    }, [addToast, formatMessage]);

    const handleIsOnline = useCallback(() => {
        addToast({
            type: 'info',
            icon: OnlineIcon,
            message: formatMessage({
                id: 'app.infoOnline',
                defaultMessage: 'You are online.'
            }),
            timeout: 3000
        });
    }, [addToast, formatMessage]);

    const handleError = useCallback(
        (error, id, loc, handleDismissError) => {
            const errorToastProps = {
                icon: ErrorIcon,
                message: `${ERROR_MESSAGE}\nDebug: ${id} ${loc}`,
                onDismiss: remove => {
                    handleDismissError();
                    remove();
                },
                timeout: 15000,
                type: 'error'
            };

            addToast(errorToastProps);
        },
        [ERROR_MESSAGE, addToast]
    );

    const talonProps = useApp({
        handleError,
        handleIsOffline,
        handleIsOnline,
        markErrorHandled,
        renderError,
        unhandledErrors
    });

    const { hasOverlay, handleCloseDrawer } = talonProps;

    const { data } = useQuery(DEFAULT_OPERATIONS.getStoreConfigData);
    const isMaintenance = data && data.storeConfig && data.storeConfig.is_maintenance;

    if (renderError) {
        return (
            <HeadProvider>
                <HeaderContextProvider>
                    <StoreTitle />
                    <Main isMasked={true} isMaintenance={isMaintenance} />
                    <Mask isActive={true} />
                    <ToastContainer />
                </HeaderContextProvider>
            </HeadProvider>
        );
    }

    if (pathname.includes('/preview-invoice-pdf')) {
        return <PreviewPDF />;
    }

    return (
        <HeadProvider>
            <HeaderContextProvider>
                <StoreTitle />
                <Main isMasked={hasOverlay} isMaintenance={isMaintenance}>
                    <Routes />
                </Main>
                <Mask isActive={hasOverlay} dismiss={handleCloseDrawer} />
                <Suspense fallback={null}>
                    <Navigation />
                </Suspense>
                <ToastContainer />
            </HeaderContextProvider>
        </HeadProvider>
    );
};

App.propTypes = {
    markErrorHandled: func.isRequired,
    renderError: shape({
        stack: string
    }),
    unhandledErrors: array
};

App.globalCSS = globalCSS;

export default App;
