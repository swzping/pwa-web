import React, { useEffect } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { FormattedMessage } from 'react-intl';
import defaultClasses from './storePickup.module.css';

const StorePickup = props => {
    const classes = useStyle(defaultClasses);

    const {
        selectedMethod,
        setSelectedMethod,
        dataApotik
    } = props;

    const handleSelect = (method) => {
        setSelectedMethod(method);
    };

    return (
        <div className={classes.deliveryContainer}>
            <div className={classes.title}>
                <FormattedMessage
                    id={'storePickup.deliveryMethod'}
                    defaultMessage={'Delivery Method'}
                />
            </div>
            <div className={classes.row}>
                <div className={classes.col6}>
                    <div
                        className={`method ${selectedMethod === 'home' ? 'active' : ''}`}
                        onClick={() => handleSelect('home')}
                    >
                        <div className={classes.column}>
                            <span className={classes.smallTitle}>
                                <FormattedMessage
                                    id={'storePickup.homeDelivery'}
                                    defaultMessage={'Home Delivery'}
                                />
                            </span>
                            <span className={classes.text}>
                                <FormattedMessage
                                    id={'storePickup.homeDeliveryInfo'}
                                    defaultMessage={'We deliver your order to your home'}
                                />
                            </span>
                        </div>
                    </div>
                </div>
                <div className={classes.col6}>
                    <div
                        className={`method ${selectedMethod === 'pickup' ? 'active' : ''}`}
                        onClick={() => handleSelect('pickup')}
                    >
                        <div className={classes.column}>
                            <span className={classes.smallTitle}>
                                <FormattedMessage
                                    id={'storePickup.storePickup'}
                                    defaultMessage={'Pickup'}
                                />
                            </span>
                            <span className={classes.text}>
                                <FormattedMessage
                                    id={'storePickup.storePickupInfo'}
                                    defaultMessage={'Pickup your order at our store'}
                                />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            { selectedMethod === 'pickup' && 
                <div className={classes.divPickup}>
                    <h3 className={classes.title}>
                        <FormattedMessage
                            id={'storePickup.pickupInformation'}
                            defaultMessage={'Pickup Information'}
                        />
                    </h3>
                    <div className='info'>
                        <table>
                            <tbody>
                                <tr>
                                    <td>
                                        <FormattedMessage
                                            id={'storePickup.address'}
                                            defaultMessage={'Address'}
                                        />
                                    </td>
                                    <td>{`: `}</td>
                                    <td>{dataApotik && dataApotik.loc_street || '-'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <FormattedMessage
                                            id={'storePickup.city'}
                                            defaultMessage={'City'}
                                        />
                                    </td>
                                    <td>{`: `}</td>
                                    <td>{dataApotik && dataApotik.loc_city || '-'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <FormattedMessage
                                            id={'storePickup.phone'}
                                            defaultMessage={'Phone'}
                                        />
                                    </td>
                                    <td>{`: `}</td>
                                    <td>{dataApotik && dataApotik.loc_telephone || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            }
        </div>
    )
};

export default StorePickup;
