import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FormattedMessage } from 'react-intl';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useToasts } from '@magento/peregrine';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';

import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import Icon from '@magento/venia-ui/lib/components/Icon';
import Button from '../../../../overrides/venia-ui/components/Button';

import { useReferralFriend } from '../../../peregrine/talons/ReferralFriend/useReferralFriend';
import defaultClasses from './referralFriend.module.css';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

const ReferralFriend = () => {
    const [copied, setCopied] = useState(false);
    const history = useHistory();
    const classes = useStyle(defaultClasses);
    const {
        isReferralInfo,
        isReferralInfoLoading,
        generatingReferralInfo,
        handleGenerateReferralInfo,
        errors,
        statusReferral,
        loadingDataInfoReferral,
        dataInfoRefferal
    } = useReferralFriend();
    const [{ isSignedIn }] = useUserContext();

    const [, { addToast }] = useToasts();

    const generateReferralInfoError = deriveErrorMessage([
        errors.get('generateReferralInfoMutation')
    ]);

    useEffect(() => {
        if (generateReferralInfoError) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: generateReferralInfoError,
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, generateReferralInfoError]);

    useEffect(() => {
        if (copied) {
            addToast({
                type: 'success',
                message: 'Copy to clipboard!',
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, copied]);

    if (!isSignedIn) {
        history.push('/');
    }

    if (isReferralInfoLoading || loadingDataInfoReferral) {
        return fullPageLoadingIndicator;
    }

    const buttonGenerateReferal = (
        <div className={classes.root}>
            <h2>Refer a Friend</h2>
            <Button
                disabled={generatingReferralInfo}
                onClick={handleGenerateReferralInfo}
                priority={'low'}
                type={'button'}
            >
                <FormattedMessage
                    id={'raf.generate'}
                    defaultMessage={'Generate'}
                />
            </Button>
        </div>
    )


    return (
        <>
            {
                statusReferral === true || isReferralInfo === true
                    ? (
                        <div className={classes.root}>
                            <div className={classes.title}>
                                <h1>Refer a Friend</h1>
                                <span>
                                    {
                                        dataInfoRefferal
                                        && dataInfoRefferal.getReferralLinkInfo
                                        && dataInfoRefferal.getReferralLinkInfo.reward_message

                                    }
                                </span>
                            </div>
                            <div className={classes.info}>
                                <p>
                                    <strong>Balance Expiration Date: </strong>{' '}
                                    {
                                        dataInfoRefferal
                                        && dataInfoRefferal.getReferralLinkInfo
                                        && dataInfoRefferal.getReferralLinkInfo.info_advocate
                                        && dataInfoRefferal.getReferralLinkInfo.info_advocate.balance_expired
                                    }
                                </p>
                                <p>
                                    <strong>Balance: </strong>{' '}
                                    {
                                        dataInfoRefferal
                                        && dataInfoRefferal.getReferralLinkInfo
                                        && dataInfoRefferal.getReferralLinkInfo.info_advocate
                                        && dataInfoRefferal.getReferralLinkInfo.info_advocate.cumulative_balance
                                    }
                                </p>
                                <p>
                                    <strong>Invited: </strong>{' '}
                                    {
                                        dataInfoRefferal
                                        && dataInfoRefferal.getReferralLinkInfo
                                        && dataInfoRefferal.getReferralLinkInfo.info_advocate
                                        && dataInfoRefferal.getReferralLinkInfo.info_advocate.invited_friends_count
                                    }{' '}
                                    Friends
                                </p>
                                <div className={classes.rules}>
                                    <strong>Rules: </strong>{' '}
                                    <ul>
                                        <li>
                                            {
                                                dataInfoRefferal
                                                && dataInfoRefferal.getReferralLinkInfo
                                                && dataInfoRefferal.getReferralLinkInfo.info_rule
                                                && dataInfoRefferal.getReferralLinkInfo.info_rule.advocate_off_text
                                            }
                                        </li>
                                        <li>
                                            {
                                                dataInfoRefferal
                                                && dataInfoRefferal.getReferralLinkInfo
                                                && dataInfoRefferal.getReferralLinkInfo.info_rule
                                                && dataInfoRefferal.getReferralLinkInfo.info_rule.friend_off_text
                                            }
                                        </li>
                                        <li>
                                            {
                                                dataInfoRefferal
                                                && dataInfoRefferal.getReferralLinkInfo
                                                && dataInfoRefferal.getReferralLinkInfo.info_rule
                                                && dataInfoRefferal.getReferralLinkInfo.info_rule.registration_required_text
                                            }
                                        </li>
                                    </ul>
                                </div>
                                <div className={classes.inputWrapper}>
                                    <input
                                        style={{ marginRight: 15 }}
                                        className={classes.input}
                                        disabled={true}
                                        value={
                                            dataInfoRefferal
                                            && dataInfoRefferal.getReferralLinkInfo
                                            && dataInfoRefferal.getReferralLinkInfo.invite_url
                                        }
                                    />
                
                                    <CopyToClipboard
                                        text={
                                            dataInfoRefferal
                                            && dataInfoRefferal.getReferralLinkInfo
                                            && dataInfoRefferal.getReferralLinkInfo.invite_url
                                        }
                                        onCopy={() => setCopied(true)}
                                    >
                                        <Button priority={'high'} type={'button'}>
                                            <FormattedMessage
                                                id={'raf.copied'}
                                                defaultMessage={'Copy'}
                                            />
                                        </Button>
                                    </CopyToClipboard>
                                </div>
                            </div>
                        </div>
                    )
                    : buttonGenerateReferal
            }
        </>
    );
};

export default ReferralFriend;
