import React from 'react';
import { FormattedMessage } from 'react-intl';

import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator/indicator';

const staticIndicator = (
    <LoadingIndicator global={true}>
        <FormattedMessage
            id={'loadingIndicator.message'}
            defaultMessage={'Fetching Data...'}
        />
    </LoadingIndicator>
);

// const staticIndicator = null;

export default staticIndicator;
