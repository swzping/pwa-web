import React, { useEffect, useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import { useRewardPointPage } from '../../../peregrine/talons/RewardPointPage/useRewardPointPage';
import defaultClasses from './rewardPointPage.module.css';
import { storeCreditDateFormat } from '../../../peregrine/hooks/storeCreditDateFormat';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';

const RewardPointPage = props => {
    const classes = useStyle(defaultClasses);
    const {
        customerRewardPoints,
        rewardPointLoading,
        rewardPointError
    } = useRewardPointPage();
    const toHTML = str => ({ __html: str });
    const { setNavConfig } = useContext(HeaderContext);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'REWARD POINT',
            useCart: false
        });
    }, []);

    if (rewardPointLoading) {
        return fullPageLoadingIndicator;
    }

    if (!customerRewardPoints || rewardPointError) {
        return null;
    }

    return (
        <div className={classes.root}>
            <div className={classes.mobileRoot}>
                <div className={classes.mobileMainWrapper}>
                    <p className={classes.mobileCurrentBalanceText}>
                        Current balance is{' '}
                        <strong>{customerRewardPoints.balance || 0}</strong>
                    </p>
                    <p className={classes.mobileCurrentBalanceText}>Total can be redeem at checkout is</p>
                    <p className={classes.mobileMainBalancePrice}>
                        {customerRewardPoints.formatedBalanceCurrency || 0}
                    </p>
                </div>

                {
                    customerRewardPoints.transaction_history.items.length > 0 ? (
                        <>
                            {
                                customerRewardPoints.transaction_history.items.map((val, id) => (
                                    <div key={id} className={classes.mobileWrapper}>
                                        <div className={classes.mobileContent}>
                                            <div className={classes.mobileSingleWrapper}>
                                                <p className={classes.infoMobileTitle}>transaction id</p>
                                                <p className={classes.infoMobileText}>
                                                    {val.transactionId}
                                                </p>
                                            </div>
                                            <div className={classes.mobileInfoWrapper}>
                                                <div>
                                                    <p className={classes.infoMobileTitle}>balance</p>
                                                    <p className={classes.infoMobileText}>
                                                        {val.balance}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={classes.infoMobileTitle}>point</p>
                                                    <p className={classes.infoMobileText}>
                                                        {
                                                            val.points < 0
                                                            ? `${val.points}`
                                                            : `+${val.points}`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={classes.mobileInfoWrapper}>
                                                <div>
                                                    <p className={classes.infoMobileTitle}>transaction date</p>
                                                    <p className={classes.infoMobileText}>
                                                        {
                                                            val.transactionDate
                                                            ? storeCreditDateFormat(val.transactionDate)
                                                            : '-'
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={classes.infoMobileTitle}>expired date</p>
                                                    <p className={classes.infoMobileText}>
                                                        {
                                                            val.expirationDate
                                                            ? storeCreditDateFormat(val.expirationDate)
                                                            : '-'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className={classes.infoMobileText}>
                                                    <div dangerouslySetInnerHTML={toHTML(val.comment)}/>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </>
                    ) : (
                        <p className={classes.mobileNoData}>No Reward Point Data</p>
                    )
                }
            </div>

            <div className={classes.titleBalance}>
                <p>
                    Current balance is{' '}
                    <strong>{customerRewardPoints.balance || 0}</strong>
                </p>
            </div>
            <div className={classes.titleCurrency}>
                <p>
                    Total can be redeem at checkout is{' '}
                    <strong>
                        {customerRewardPoints.formatedBalanceCurrency || 0}
                    </strong>
                </p>
            </div>

            <div>
                <table className={classes.table}>
                    <thead>
                        <tr className={classes.tableHeader}>
                            <th>Transaction ID</th>
                            <th>Balance</th>
                            <th>Comment</th>
                            <th>Expired date</th>
                            <th>Point</th>
                            <th>Transaction date</th>
                        </tr>
                    </thead>
                    {customerRewardPoints.transaction_history.items.length >
                    0 ? (
                        <tbody>
                            {customerRewardPoints.transaction_history.items.map(
                                (val, id) => (
                                    <tr key={id}>
                                        <td>{val.transactionId}</td>
                                        <td>{val.balance}</td>
                                        <td><div dangerouslySetInnerHTML={toHTML(val.comment)}/></td>
                                        <td>
                                            {val.expirationDate
                                                ? storeCreditDateFormat(val.expirationDate)
                                                : '-'}
                                        </td>
                                        <td>
                                            {' '}
                                            {val.points < 0
                                                ? `${val.points}`
                                                : `+${val.points}`}
                                        </td>
                                        <td>
                                            {val.transactionDate
                                                ? storeCreditDateFormat(val.transactionDate)
                                                : '-'}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    ) : (
                        <tr>
                        <td colSpan={6} style={{ textAlign: 'center' }}>
                            <p>No Reward Point Data</p>
                        </td>
                    </tr>
                    )}
                </table>
            </div>
        </div>
    );
};

export default RewardPointPage;
