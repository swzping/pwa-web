import React, { useMemo } from 'react';
import { 
    GoogleMap, 
    InfoWindow,
    Marker,
} from '@react-google-maps/api';
import Button from '@magento/venia-ui/lib/components/Button';
import { useStyle } from '@magento/venia-ui/lib/classify';

import { useMapDisplay } from '../../../peregrine/talons/MapDisplay/useMapDisplay';
import ConfirmationPinPoint from './confirmationPinPoint';
import MapSearchBox from './mapSearchBox';
import MapRadiusSlider from './mapRadiusSlider';
import defaultClasses from './mapDisplay.module.css';

 
const MapDisplay = (props) => {
    const classes = useStyle(defaultClasses);

    const { 
        center,
        disableMarker = false,
        enableConfirmationPinPoint = false,
        enableSearchBox = false,
        enableFilters = false,
        markers = [],
        onSelectLocation,
        pointedPosition,
        renderCircles,
        radius,
        radiusOnChange,
        resetOnClick,
        styles,
        searchBoxData,
        hidePointedPosition = false,
        zoom = 17
    } = props;

    const { 
        center: centerPoint,
        googleMapOnLoad,
        handleInfoWindowOnClose,
        handleMarkerOnClick,
        handleResetOnClick,
        isMapLoaded,
        infoWindowIsOpen,
        mapContainerStyles,
        markerData,
        markerProps,
        searchBoxRef,
        searchBoxOnLoad,
        searchBoxOnPlacesChanged
    } = useMapDisplay({ 
        center, 
        markers, 
        onSelectLocation,
        pointedPosition,
        resetOnClick,
        hidePointedPosition,
        styles
    });

    const maybeSearchbox = useMemo(
        () => {
            return enableSearchBox && !enableFilters ? (
                <div className="pb-3">
                    <MapSearchBox
                        searchBoxRef={searchBoxRef}
                        data={searchBoxData}
                        onLoad={searchBoxOnLoad}
                        onPlacesChanged={searchBoxOnPlacesChanged}
                    />
                </div>
            ) : null;
        },
        [
            enableSearchBox,
            enableFilters,
            searchBoxOnPlacesChanged
        ],
    );

    const maybeFilters = useMemo(
        () => {
            return enableFilters ? (
                <div className='row'>
                    <div className="col-sm-12 col-md-5 pt-2">
                        <MapSearchBox
                            searchBoxRef={searchBoxRef}
                            data={searchBoxData}
                            disableLabel
                            onLoad={searchBoxOnLoad}
                            onPlacesChanged={searchBoxOnPlacesChanged}
                        />
                    </div>
                    <div className="col-xs-8 col-sm-4 col-md-5 pt-2 d-flex align-items-center">
                        <MapRadiusSlider
                            onChange={radiusOnChange}
                            values={radius}
                        />
                    </div>
                    <div className="col-xs-4 col-sm-3 col-md-2 pt-2">
                        <Button
                            priority="high"
                            type="button"
                            onClick={handleResetOnClick}
                        >
                            reset
                        </Button>
                    </div>
                </div>
            ) : null;
        },
        [
            enableFilters,
            handleResetOnClick,
            radius,
            radiusOnChange,
            searchBoxRef,
            searchBoxOnPlacesChanged,
        ],
    );

    return isMapLoaded ? (
        <div className={classes.root}>
            {enableConfirmationPinPoint && <ConfirmationPinPoint />}
            <GoogleMap
                center={centerPoint}
                mapContainerStyle={mapContainerStyles}
                onLoad={googleMapOnLoad}
                zoom={zoom}
            >
                {renderCircles}
                {!disableMarker && markerData.map((marker, index) => (
                    <Marker 
                        key={`marker-${index}`}
                        onClick={() => handleMarkerOnClick(index)} 
                        position={{ lat: marker.lat, lng: marker.lng }} 
                        {...markerProps}
                    >
                        {infoWindowIsOpen[index] && marker.info && (
                            <InfoWindow
                                onCloseClick={() => handleInfoWindowOnClose(index)}
                                options={{
                                    maxWidth: 300,
                                    pixelOffset: new google.maps.Size(0, 20),
                                }}
                                position={{ lat: marker.lat, lng: marker.lng }} 
                            >
                                <>
                                    <div dangerouslySetInnerHTML={{ __html: marker.info }} />
                                    <a
                                        className="direction_button"
                                        href={`https://www.google.com/maps/dir/Current+Location/${marker.lat},${marker.lng}`}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        Direction
                                    </a>
                                </>
                            </InfoWindow>
                        )}
                    </Marker>
                ))}
            </GoogleMap>
            {maybeSearchbox}
            {maybeFilters}
        </div>
    ) : <></>;
};

export default React.memo(MapDisplay);
