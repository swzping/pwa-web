import React, { useState } from 'react';
import { Form, useFormApi, Text } from 'informed';
import Checkbox from '@magento/venia-ui/lib/components/Checkbox';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './accountSetting.module.css';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { useSettings } from '../../../peregrine/talons/Settings/useSettings';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useHistory } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';

const AccountSetting = () => {
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const { formatMessage } = useIntl();

    const {
        customer,
        customLoading,
        handleSave,
    } = useSettings();

    const [{ isSignedIn }] = useUserContext();

    if (!isSignedIn) {
        history.push('/');
    }

    const handleClick = () => {
        handleSave();
    };

    const loadingComponent = (
        <>
            <div className={classes.contentWrapper}>
                <Shimmer key="account-setting" width="200px" height='40px' />
            </div>
            <div>
                <Shimmer key="account-setting-radio" width="200px" height='40px' />
            </div>
        </>
    );


    return (
        <>
            <div className={`${classes.root} d-flex`}>
                {
                    !customLoading ? (
                        <>
                            <div className={classes.contentWrapper}>
                                <h3 className={classes.title}>
                                    <FormattedMessage
                                        id={'accountSetting.subscribeNewsletter'}
                                        defaultMessage={'Subscribe Newsletter'}
                                    />
                                </h3>
                                <Form>
                                    <Checkbox
                                        field="subscribe"
                                        id="subscribe"
                                        label={formatMessage({
                                            id: 'accountSetting.generalSubscriptions',
                                            defaultMessage: 'General Subscriptions'
                                        })}
                                        fieldValue={customer}
                                        disabled={customLoading}
                                        onChange={handleClick}
                                    />
                                </Form>
                            </div>
                            {/* <div className={classes.contentWrapper}>
                                <h3 className={classes.title}>bahasa</h3>
                                <div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="radio" name="languange" id="Indonesia" />
                                        <label className="form-check-label" htmlFor="Indonesia">
                                            Bahasa Indonesia
                                        </label>
                                        </div>
                                        <div className="form-check">
                                        <input className="form-check-input" type="radio" name="languange" id="English" />
                                        <label className="form-check-label" htmlFor="English">
                                            English
                                        </label>
                                        </div>
                                </div>
                            </div> */}

                        </>
                    ) : (
                        loadingComponent
                    )
                }
            </div>
        </>
    )
}

export default AccountSetting
