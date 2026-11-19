import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { array, func, oneOfType, shape, string, node } from 'prop-types';
import { gql, useQuery } from '@apollo/client';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import Block from '@magento/venia-ui/lib/components/CmsBlock/block';
import defaultClasses from '@magento/venia-ui/lib/components/CmsBlock/cmsBlock.module.css';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';

const CmsBlockGroup = props => {
    const { identifiers, shimmer } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const [isShimmer, setShimmer] = useState(null);

    // const { loading, error, data } = useQuery(GET_CMS_BLOCKS, {
    //     variables: { identifiers },
    //     fetchPolicy: 'cache-and-network',
    //     nextFetchPolicy: 'cache-first'
    // });
    const { loading, error, data } = useQuery(GET_CMS_BLOCKS, {
        variables: { identifiers },
        fetchPolicy: 'no-cache',
    });

    useEffect(async () => {
        try {
            await setShimmer(shimmer);
        } catch (e) {
            await setShimmer();
        }
    }, [shimmer]);

    if (loading) {
        if (isShimmer != null) {
            return isShimmer;
        } else {
            return fullPageLoadingIndicator;
        }
    }

    if (error || !data) {
        return <ErrorView message={error.message} />;
    }

    const { items } = data.cmsBlocks;

    if (!Array.isArray(items) || !items.length) {
        return (
            <div>
                <FormattedMessage
                    id={'cmsBlock.noBlocks'}
                    defaultMessage={'There are no blocks to display'}
                />
            </div>
        );
    }

    const BlockChild = typeof children === 'function' ? children : Block;
    const blocks = items.map((item, index) => (
        <BlockChild
            key={item.identifier}
            className={classes.block}
            index={index}
            {...item}
        />
    ));

    return (
        <div className={classes.root}>
            <div className={classes.content}>{blocks}</div>
        </div>
    );
};

CmsBlockGroup.propTypes = {
    children: func,
    classes: shape({
        block: string,
        content: string,
        root: string
    }),
    shimmer: node,
    identifiers: oneOfType([string, array])
};

export default CmsBlockGroup;

export const GET_CMS_BLOCKS = gql`
    query cmsBlocks($identifiers: [String]!) {
        cmsBlocks(identifiers: $identifiers) {
            items {
                content
                identifier
            }
        }
    }
`;
