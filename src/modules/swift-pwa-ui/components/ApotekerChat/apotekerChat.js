import React, { useState, useMemo } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Image from '@magento/venia-ui/lib/components/Image';
import { gql, useQuery } from '@apollo/client';
import CmsBlock from '@magento/venia-ui/lib/components/CmsBlock/block';

import defaultClasses from './apotekerChat.module.css';

const identifier = 'floating_banner'

const ApotekerChat = (props) => {
    const [isVisible, setIsVisible] = useState(true)
    const classes = useStyle(defaultClasses);

    const { loading, error, data } = useQuery(GET_FLOATING_BANNER, {
        variables: { identifiers: [ identifier ] },
        fetchPolicy: 'no-cache',
    });

    const content = useMemo(() => {
        return (data?.cmsBlocks?.items || []).find(
            item => item.identifier === identifier
        )?.content;
    }, [data]);

    if(loading) {
        return null
    }

    return isVisible ? (
        <div className={classes.container}>
            <div className={classes.floatingApotekerButton}>
                <div className={classes.floatingBannerImage}>
                    <CmsBlock content={content} />
                </div>
                <button
                    className={classes.closeButton}
                    onClick={() => setIsVisible(false)}
                >
                    <Image
                        alt="Close Tanya Apoteker"
                        src="/venia-static-assets/images/close.png"
                        width={19}
                        height={19}
                    />
                </button>
            </div>
        </div>
    ) : null;
};

export default ApotekerChat;

export const GET_FLOATING_BANNER = gql`
    query getFloatingBanner($identifiers: [String]!) {
        cmsBlocks(identifiers: $identifiers) {
            items {
                content
                identifier
            }
        }
    }
`;
