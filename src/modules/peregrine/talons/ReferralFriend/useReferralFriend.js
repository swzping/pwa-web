import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import {
    getCheckReferralQuery,
    getReferralInfoQuery,
    generateReferralInfoMutation
} from './referralFriend.gql';

export const useReferralFriend = () => {
    const [{ isSignedIn }] = useUserContext();
    const [statusReferral, setStatusReferral] = useState(false);

    const checkReferralResult = useQuery(getCheckReferralQuery, {
        fetchPolicy: 'no-cache',
        skip: !isSignedIn
    });

    const [getReferralData, { 
        data: dataInfoRefferal,
        loading: loadingDataInfoReferral 
    }] = useLazyQuery(getReferralInfoQuery,{
        fetchPolicy: 'no-cache',
        skip: !isSignedIn
    });

    const [
        generateReferralInfo,
        { error: generateReferralInfoError, loading: generatingReferralInfo }
    ] = useMutation(generateReferralInfoMutation);

    const handleGenerateReferralInfo = useCallback(async () => {
        try {
            if (!isSignedIn) return;
            await generateReferralInfo();
            getReferralData({
                fetchPolicy: 'no-cache',
                skip: !isSignedIn
            })
            setStatusReferral(true);
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(error);
            }
        }
    }, [generateReferralInfo]);

    const errors = useMemo(
        () =>
            new Map([
                ['generateReferralInfoMutation', generateReferralInfoError]
            ]),
        [generateReferralInfoError]
    );

    useEffect(() => {
        if ( typeof window !== 'undefined' && !loadingDataInfoReferral) {
            getReferralData({
                fetchPolicy: 'no-cache',
                skip: !isSignedIn
            })
        }
    }, []);

    return {
        isReferralInfo:
            checkReferralResult.data &&
            Boolean(checkReferralResult.data.isReferralInfoGenerated),
        isReferralInfoLoading: Boolean(checkReferralResult.loading),
        errors,
        generatingReferralInfo,
        handleGenerateReferralInfo,
        statusReferral,
        loadingDataInfoReferral,
        dataInfoRefferal

    };
};
