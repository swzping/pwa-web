import React, { useContext, useEffect } from 'react'
import useRevokeCustomerToken from '@/lib/useRevokeCustomerToken';
import AccountSetting from '../../../custom-modules/components/CustomAccountInformation/AccountSetting';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './settingPage.module.css';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import { FormattedMessage } from 'react-intl';

const SettingPage = () => {
    const classes = useStyle(defaultClasses);
    const userContext = useUserContext();
    const revokeToken = useRevokeCustomerToken();
    const { setNavConfig } = useContext(HeaderContext);

    useEffect(() => {
        setNavConfig({
            showMobileNav: true,
            headerTitle: "PENGATURAN",
            useCart: false,
            borderBottom: true
        });
    }, []);

    return (
        <div className={classes.root}>
            <AccountSetting />
            <button
                className={classes.signoutButton}
                onClick={() => userContext[1].signOut({ revokeToken, explicit: true })}
            >
                <FormattedMessage
                    id={'accountSetting.logout'}
                    defaultMessage={'Logout'}
                />
            </button>
        </div>
    )
}

export default SettingPage
