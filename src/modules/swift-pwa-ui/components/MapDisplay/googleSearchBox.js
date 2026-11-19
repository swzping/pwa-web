import React, { useCallback, useRef, useMemo } from 'react';
import { StandaloneSearchBox } from '@react-google-maps/api';

import Field from '@magento/venia-ui/lib/components/Field';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { Search as SearchIcon } from 'react-feather';

const GoogleSearchBox = (props) => {
    const {
        searchBoxRef,
        disableLabel = false,
        label = 'Search Location',
        onLoad,
        onPlacesChanged
    } = props;

    const searchIcon = <Icon src={SearchIcon} size={24} />;

    const handleOnPlaceChanged = () => {
        const [place] = searchBoxRef.current.getPlaces();
        const target = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            info: place.formatted_address
        };

        onPlacesChanged(place.formatted_address, target);
    };
    

    const searchField = useMemo(() => {
        const textInput = <TextInput
            field=""
            placeholder={'Enter your Location'}
            before={searchIcon}
        />;

        if (!disableLabel) {
            return (
                <Field id="search_place" label={label}>
                    {textInput}
                </Field>
            );
        }

        return textInput;
    }, [disableLabel, label]);
    
    return (
        <StandaloneSearchBox
            onLoad={onLoad}
            onPlacesChanged={handleOnPlaceChanged}
        >
            {searchField}
        </StandaloneSearchBox>
    );
}

export default GoogleSearchBox;