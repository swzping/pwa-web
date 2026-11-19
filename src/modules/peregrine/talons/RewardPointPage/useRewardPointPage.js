import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { getRewardPoint } from './rewardPointPage.gql';

export const useRewardPointPage = props => {
    const [page, setPage] = useState(0);
    const [count, setRowsPerPage] = useState(10);

    const [{ isSignedIn }] = useUserContext();

    const {
        data: rewardPointData,
        loading: rewardPointLoading,
        error: rewardPointError
    } = useQuery(getRewardPoint, {
        variables: {
            pageSize: count,
            currentPage: page + 1
        },
        skip: !isSignedIn
    });

    let customerRewardPoints = {
        balance: 0,
        balanceCurrency: 0,
        formatedBalanceCurrency: '$0.00',
        formatedSpendRate: '$0.00',
        spendRate: 1,
        transaction_history: {
            items: [],
            page_info: {
                current_page: 1,
                page_size: 10,
                total_pages: 0
            },
            total_count: 0
        }
    };

    if (rewardPointData && rewardPointData.customerRewardPoints)
        customerRewardPoints = rewardPointData.customerRewardPoints;

    return {
        rewardPointData,
        rewardPointError,
        rewardPointLoading,
        customerRewardPoints
    };
};
