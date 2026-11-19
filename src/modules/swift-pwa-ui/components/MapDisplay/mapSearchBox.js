import React from 'react';

import GoogleSearchBox from './googleSearchBox';
import StoreLocatorSearchBox from '../StoreLocatorSearchBox';

const MapSearchBox = (props) => {
    return !props.data
        ? <GoogleSearchBox {...props} />
        : <StoreLocatorSearchBox
            field="search_place"
            placeHolder="Enter your Location"
            {...props}
        />;
};

export default MapSearchBox;
