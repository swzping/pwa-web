import React, { useEffect, useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import Price from '@magento/venia-ui/lib/components/Price';
import { useStoreCredit } from '../../../peregrine/talons/StoreCreditPage/useStoreCreditPage';
import defaultClasses from './storeCreditPage.module.css';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import { storeCreditDateFormat } from '../../../peregrine/hooks/storeCreditDateFormat';

const StoreCreditPage = props => {
    const classes = useStyle(defaultClasses);
    const { data, loading, error, storeCredit } = useStoreCredit();
    const { setNavConfig } = useContext(HeaderContext);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'STORE CREDIT',
            useCart: false
        });
    }, []);

    if (loading) {
        return fullPageLoadingIndicator;
    }

    if (!data || error) {
        return null;
    }

    return (
        <div className={classes.root}>
            <div className={classes.mobileRoot}>
                <div className={classes.mobileMainWrapper}>
                    <p className={classes.mobileCurrentBalanceText}>current balance</p>
                    <p className={classes.mobileMainBalancePrice}>
                        <Price
                            value={storeCredit.current_balance.value}
                            currencyCode={storeCredit.current_balance.currency}
                        />
                    </p>
                </div>

                {
                    storeCredit.transaction_history.items.length > 0 ? (
                        <>
                            {
                                storeCredit.transaction_history.items.map((val, id) => (
                                    <div key={id} className={classes.mobileWrapper}>
                                        <div className={classes.mobileContent}>
                                            <div className={classes.mobileInfoWrapper}>
                                                <div>
                                                    <p className={classes.infoMobileTitle}>transaction id</p>
                                                    <p className={classes.infoMobileText}>
                                                        {val.transaction_id}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={classes.infoMobileTitle}>transaction date</p>
                                                    <p className={classes.infoMobileText}>
                                                        {storeCreditDateFormat(val.transaction_date_time)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={classes.mobileInfoWrapper}>
                                                <div>
                                                    <p className={classes.infoMobileTitle}>store credit adjustment</p>
                                                    <p className={classes.infoMobileText}>
                                                        {val.store_credit_adjustment.value}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={classes.infoMobileTitle}>store credit balance</p>
                                                    <p className={classes.infoMobileText}>
                                                        <Price
                                                            value={
                                                                val.store_credit_balance.value
                                                            }
                                                            currencyCode={
                                                                val.store_credit_balance.currency
                                                            }
                                                        />
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className={classes.infoMobileText}>
                                                    {val.comment}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </>
                    ) : (
                        <p className={classes.mobileNoData}>No Store Credit Data</p>
                    )
                }
            </div>

            <div className={classes.desktopRoot}>
                <div className={classes.titleBalance}>
                    <p>
                        Current balance{' '}
                        <strong>
                            <Price
                                value={storeCredit.current_balance.value}
                                currencyCode={storeCredit.current_balance.currency}
                            />
                        </strong>
                    </p>
                </div>

                <div>
                    <table className={classes.table}>
                        <thead>
                            <tr className={classes.tableHeader}>
                                <th>Transaction ID</th>
                                <th>Store credit adjustment</th>
                                <th>Store credit balance</th>
                                <th>Comment</th>

                                <th>Transaction date</th>
                            </tr>
                        </thead>
                        {storeCredit.transaction_history.items.length > 0 ? (
                            <tbody>
                                {storeCredit.transaction_history.items.map(
                                    (val, id) => (
                                        <tr key={id}>
                                            <td>{val.transaction_id}</td>
                                            <td>
                                                {val.store_credit_adjustment.value}
                                            </td>
                                            <td>
                                                <Price
                                                    value={
                                                        val.store_credit_balance
                                                            .value
                                                    }
                                                    currencyCode={
                                                        val.store_credit_balance
                                                            .currency
                                                    }
                                                />
                                            </td>
                                            <td>{val.comment}</td>

                                            <td>
                                                {storeCreditDateFormat(val.transaction_date_time)}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        ) : (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center' }}>
                                    <p>No Store Credit Data</p>
                                </td>
                            </tr>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StoreCreditPage;
