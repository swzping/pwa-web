import React, { Fragment, Suspense, useState } from 'react';
import { useIntl } from 'react-intl';
import { shape, string } from 'prop-types';

import { useAccountTrigger } from '@magento/peregrine/lib/talons/Header/useAccountTrigger';
import { useStyle } from '@magento/venia-ui/lib/classify';

// import AccountChip from '@magento/venia-ui/lib/components/AccountChip';
import { AccountCircleOutlined } from '@/assets/icons';

import defaultClasses from './accountTrigger.module.css';

const AccountMenu = React.lazy(() => import('../AccountMenu'));
import { useHistory } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import InfoPop from './components/AccountInfo/InfoPop'

const GET_POINT_BALANCE = gql`
    query GetPointBalance {
        getBalancePoint {
            success
            code
            message
            data {
                point
            }
        }
        getExpiringPoints {
            success
            code
            message
            data {
                expiringPoint
                expiringTime
            }
        }
    }
`;

function formatDate(timestamp) {
  const date = new Date(timestamp);

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * The AccountTrigger component is the call to action in the site header
 * that toggles the AccountMenu dropdown.
 *
 * @param {Object} props
 * @param {Object} props.classes - CSS classes to override element styles.
 */
const AccountTrigger = props => {
    const talonProps = useAccountTrigger();
    const {
        accountMenuIsOpen,
        accountMenuRef,
        accountMenuTriggerRef,
        setAccountMenuIsOpen,
        handleTriggerClick,
        isUserSignedIn,
        currentUser
    } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);
    const rootClassName = accountMenuIsOpen ? classes.root_open : classes.root;
    const { formatMessage } = useIntl();
    const history = useHistory();
    const { data } = useQuery(GET_POINT_BALANCE, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const balancePoint = data?.getBalancePoint?.data?.point || 0;
    const expiringPoint = data?.getExpiringPoints?.data?.expiringPoint || 0;
    const expiringTime = formatDate(data?.getExpiringPoints?.data?.expiringTime);

    const [isInfoPop, setIsInfoPop] = useState(false);

    const formatPoints = value => {
        const stringValue = String(value != null ? value : '');
        const isNegative = stringValue.trim().startsWith('-');
        const raw = stringValue.replace(/[^0-9]/g, '');
        if (raw === '') return '0';
        const formatted = Number(raw).toLocaleString();;
        return isNegative ? `-${formatted}` : formatted;
    };

    return (
        <Fragment>
            {isUserSignedIn && (
                <div style={{ position: 'relative' }}>
                    <div className={classes.point}>
                        <img
                            style={{ marginRight: 8, fontSize: 28 }}
                            src={'/venia-static-assets/images/gim.png'}
                        />
                        <span>{formatPoints(balancePoint)}</span>
                    </div>
                    <div className={classes.pointPop}>
                        <div className={classes.arrow} />
                        <div className={classes.leftNum}>
                            <img
                                style={{ margin: '0 4px' }}
                                src={'/venia-static-assets/images/gim.png'}
                            />
                            <span>{formatPoints(balancePoint)}</span>
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 32 32"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    setIsInfoPop(true);
                                }}
                            >
                                <path
                                    d="M16 6.25C12.4844 6.25 9.29688 8.125 7.51562 11.125C5.78125 14.1719 5.78125 17.875 7.51562 20.875C9.29688 23.9219 12.4844 25.75 16 25.75C19.4688 25.75 22.6562 23.9219 24.4375 20.875C26.1719 17.875 26.1719 14.1719 24.4375 11.125C22.6562 8.125 19.4688 6.25 16 6.25ZM16 28C11.6875 28 7.75 25.75 5.59375 22C3.4375 18.2969 3.4375 13.75 5.59375 10C7.75 6.29688 11.6875 4 16 4C20.2656 4 24.2031 6.29688 26.3594 10C28.5156 13.75 28.5156 18.2969 26.3594 22C24.2031 25.75 20.2656 28 16 28ZM14.125 19.75H15.25V16.75H14.125C13.4688 16.75 13 16.2812 13 15.625C13 15.0156 13.4688 14.5 14.125 14.5H16.375C16.9844 14.5 17.5 15.0156 17.5 15.625V19.75H17.875C18.4844 19.75 19 20.2656 19 20.875C19 21.5312 18.4844 22 17.875 22H14.125C13.4688 22 13 21.5312 13 20.875C13 20.2656 13.4688 19.75 14.125 19.75ZM16 13C15.1562 13 14.5 12.3438 14.5 11.5C14.5 10.7031 15.1562 10 16 10C16.7969 10 17.5 10.7031 17.5 11.5C17.5 12.3438 16.7969 13 16 13Z"
                                    fill="black"
                                />
                            </svg>
                        </div>
                        <div className={classes.leftDate}>
                            {!!expiringPoint && <span>{formatPoints(expiringPoint)} points will expire by {expiringTime}</span>}
                            <span className={classes.pointLink} onClick={() => {
                                history.push({
                                    pathname: '/my-account-information',
                                    state: { tabId: 'myPoints' }
                                });
                            }}>
                                Point History &#62;
                            </span>
                        </div>
                    </div>
                </div>
            )}
            {isInfoPop && <InfoPop cms={data?.storeConfig?.cms_homepage_identifer} onClose={() => setIsInfoPop(false)} />}
            <div
                className={`${rootClassName} hidden-mobile`}
                ref={accountMenuTriggerRef}
            >
                <button
                    aria-label={formatMessage({
                        id: 'accountTrigger.ariaLabel',
                        defaultMessage: 'Toggle My Account Menu'
                    })}
                    className={classes.trigger}
                    // onClick={handleTriggerClick}
                    onClick={() => {
                         if(isUserSignedIn) {
                             history.push(`/my-account-information`);
                         } else {
                            history.push(`/sign-in`);
                         }
                    }}
                >
                    {/* <AccountChip
                        fallbackText={formatMessage({
                            id: 'accountTrigger.buttonFallback',
                            defaultMessage: 'Sign In'
                        })}
                        shouldIndicateLoading={true}
                    /> */}
                    <div className={classes.accountBtnWrapper}>
                        <AccountCircleOutlined
                            className={classes.accountBtnIcon}
                        />
                        <div className={classes.accountBtnName}>
                            {isUserSignedIn ? `Hi, ${currentUser?.firstname?.split(' ')?.[0] || currentUser?.firstname || ' '}` : 'LOGIN / REGISTER'}
                        </div>
                    </div>
                </button>
            </div>
            <Suspense fallback={null}>
                <AccountMenu
                    ref={accountMenuRef}
                    accountMenuIsOpen={accountMenuIsOpen}
                    setAccountMenuIsOpen={setAccountMenuIsOpen}
                />
            </Suspense>
        </Fragment>
    );
};

export default AccountTrigger;

AccountTrigger.propTypes = {
    classes: shape({
        root: string,
        root_open: string,
        trigger: string
    })
};
