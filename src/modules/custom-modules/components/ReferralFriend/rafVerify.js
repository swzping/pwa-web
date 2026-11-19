import React, { useMemo, useCallback } from 'react';
import Button from '@magento/venia-ui/lib/components/Button';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { useLocation, useHistory } from 'react-router-dom';
import { getSearchParam } from '@magento/peregrine/lib/hooks/useSearchParam';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useRafVerify } from '../../../peregrine/talons/rafVerify/useRafVerify';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './rafVerify.module.css';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';

const RafVerify = () => {
    const location = useLocation();
    const history = useHistory();
    const [{ isSignedIn }] = useUserContext();
    const classes = useStyle(defaultClasses);
    
    const awRafNumber = useMemo(() => {
        return getSearchParam('awraf', location);
    }, [getSearchParam, location]);
    
    if (!isSignedIn) {
        history.push(`/sign-in?awraf=${awRafNumber}`);
    }

    const talonProps = useRafVerify({
        awRafNumber
    });
    const {
        data,
        error,
        loading
    } = talonProps;

    const handleGoHome = useCallback(() => {
        history.push('/');
    }, [history]);

    if (error) {
        return (
            <ErrorView message="Refer a Friend Error" />
        );
    }

    if (loading || !data) {
        return (
            <div className={classes.root}>
                <div className={classes.content}>
                    <div className={classes.title}>
                        <Shimmer width="250px" height="20px" />
                    </div>
                    <div className={classes.header}>
                        <Shimmer width="280px" height="60px" />
                    </div>
                    <div className={classes.message}>
                        <Shimmer width="300px" height="30px" />
                    </div>
                    <div>
                        <Shimmer width="200px" height="30px" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <div className={classes.content}>
                <p className={classes.title}>
                    Verifying Refer a Friend Code
                </p>
                <p className={classes.header}>
                    {
                        (data && data.consumeReferralLink && data.consumeReferralLink.status) ? 'Success' : 'Failed'
                    }
                </p>
                <p className={classes.message}>
                    {
                        data 
                        && data.consumeReferralLink
                        && data.consumeReferralLink.message
                    }
                </p>
                <div>
                    <Button type="button" className={classes.buttonToHome} onClick={handleGoHome}>
                        Back to Homepage
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RafVerify;
