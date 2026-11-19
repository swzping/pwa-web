import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { getStoreCredit } from './storeCreditPage.gql';

export const useStoreCredit = props => {
    const [page, setPage] = useState(0);
    const [count, setRowsPerPage] = useState(10);

    const [{ isSignedIn }] = useUserContext();

    const { data, loading, error } = useQuery(getStoreCredit, {
        variables: {
            pageSizeStoreCredit: count,
            currentPageStoreCredit: page + 1
        },
        skip: !isSignedIn
    });

    let storeCredit = {
        current_balance: {
            value: 0,
            currency: 'USD'
        },
        transaction_history: {
            items: []
        }
    };

    if (data) {
        storeCredit = data.customer.store_credit;
    }

    return {
        data,
        loading,
        error,
        storeCredit
    };
};
