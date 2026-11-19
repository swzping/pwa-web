import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';

import defaultClasses from './confirmationPinPoint.module.css';

const confirmationPinPoint = () => {
    const classes = useStyle(defaultClasses);
    const { formatMessage } = useIntl();

    const [isChecked, setIsChecked] = useState(false);

    return !isChecked ? (
        <div className={classes.root}>
            <div className={classes.wrapper}>
                <div className={classes.header}>
                    <input 
                        type="checkbox" 
                        name="confirmPinPoint"
                        checked={isChecked}
                        onChange={() => setIsChecked(true)}
                    />
                    <span>
                        {formatMessage({
                            id: 'mapDisplay.confirmationPinPoint',
                            defaultMessage: 'Please confirm your pin location :'
                        })}
                    </span>
                </div>
                <div className={classes.body}>
                    <p>
                        {formatMessage({
                            id: 'customer:address:confirmPinPointText1',
                            defaultMessage: '**By clicking Confirm Your Location, I hereby:',
                        })}
                    </p>
                    <p>
                        {formatMessage({ 
                            id: 'customer:address:confirmPinPointText2', 
                            defaultMessage: '- Agree that the address point is correct',
                        })}
                        <br />
                        {formatMessage({ 
                            id: 'customer:address:confirmPinPointText3', 
                            defaultMessage: '- Any kinds of shipping errors due to live tracking limitations are not our responsibility',
                        })}
                    </p>
                </div>
            </div>
        </div>
    ) : null;
};

export default confirmationPinPoint;
