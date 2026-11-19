import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useFormApi } from 'informed';

const GOOGLE_MAPS_LIBRARIES = ['drawing', 'geometry', 'places'];

export const GOOGLE_MAPS_DEFAULT_POSITION = { lat: '-6.197361', lng: '106.774535'};
// dummy location
// export const GOOGLE_MAPS_DEFAULT_POSITION = { lat: '-6.91623410', lng: '107.61119750'};

export const useMapDisplay = (props = {}) => {
    const mapContainerStyles = { height: '210px', ...props.styles };
    const {
        markers, 
        onSelectLocation, 
        pointedPosition,
        resetOnClick,
        hidePointedPosition,
    } = props;

    const formApi = useFormApi();

    const googleMapRef = useRef();
    const searchBoxRef = useRef();

    const { 
        isLoaded: isMapLoaded, 
        loadError: errorMapLoad 
    } = useJsApiLoader({
        googleMapsApiKey: process.env.GOOGLE_MAPS_APIKEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [infoWindowIsOpen, setInfoWindowIsOpen] = useState({});

    const getCoordsInNumber = (coords) => ({
        ...coords,
        lat: setZeroIfEmpty(coords.lat),
        lng: setZeroIfEmpty(coords.lng),
    });

    const handleMarkerOnClick = useCallback((index) => {
        setInfoWindowIsOpen({
            ...infoWindowIsOpen, 
            [index]: typeof infoWindowIsOpen[index] === 'undefined' ? true : !infoWindowIsOpen[index]
        });
    }, []);

    const handleMarkerDragEnd = useCallback(
        (event) => {
            const newPosition = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
            };
            setSelectedPosition(newPosition);
        },
        [],
    );

    const handleResetOnClick = useCallback(
        () => {
            formApi.setValue('search_place', '');
    
            googleMapRef.current.panTo(pointedPosition);

            setSelectedPosition(null);

            resetOnClick();
        },
        [formApi, googleMapRef, setSelectedPosition, resetOnClick],
    );

    const handleInfoWindowOnClose = useCallback((index) => {
        setInfoWindowIsOpen({
            ...infoWindowIsOpen, 
            [index]: false,
        });
    }, []);

    const googleMapOnLoad = useCallback(
        ref => googleMapRef.current = ref,
        [googleMapRef],
    );

    const searchBoxOnLoad = useCallback(
        ref => searchBoxRef.current = ref,
        [searchBoxRef],
    );

    const searchBoxOnPlacesChanged = useCallback(
        (value, target) => {
            formApi.setValue('search_place', value);
    
            googleMapRef.current.panTo(target);
    
            setSelectedPosition(target);
        },
        [formApi, googleMapRef, setSelectedPosition],
    );

    const setZeroIfEmpty = (value) => {
        const emptyValues = [undefined, null, '', 'undefined', 'null'];
        return emptyValues.includes(value) ? 0 : Number(value);
    };

    const center = useMemo(() => {
        let position = GOOGLE_MAPS_DEFAULT_POSITION;

        if(props.center) position = props.center;
        
        if(
            !selectedPosition 
            && pointedPosition 
            && pointedPosition.lat 
            && pointedPosition.lng
        ) {
            position = pointedPosition;
        }

        if (selectedPosition) position = selectedPosition;

        return getCoordsInNumber(position);
    }, [props.center, pointedPosition, selectedPosition]);

    const markerData = useMemo(() => {
        const formattedMarkers = markers.map((marker) => {
            return getCoordsInNumber(marker);
        });

        /**
         * pointedPosition is position of user either:
         *  set by prop, 
         *  set by drag marker, 
         *  or set by enter submit searchbox
         *  */ 
        if (!hidePointedPosition) {            
            // if set default point location, and not update location
            if(
                !selectedPosition
                && pointedPosition 
                && pointedPosition.lat
                && pointedPosition.lng
            ) {
                formattedMarkers.push(getCoordsInNumber(pointedPosition));
            }
            // if updated location by drag marker or search box
            if (selectedPosition) {
                formattedMarkers.push(getCoordsInNumber(selectedPosition));
            }
        }

        return formattedMarkers;
    }, [
        markers,
        pointedPosition,
        hidePointedPosition,
        selectedPosition,
    ]);

    const markerProps = pointedPosition 
        ? { draggable: true, onDragEnd: handleMarkerDragEnd } 
        : {};

    useEffect(() => {
        if (onSelectLocation) {
            onSelectLocation(selectedPosition || pointedPosition);
        }
    }, [onSelectLocation, selectedPosition]);

    useEffect(() => {
        const positionIndex = markerData.findIndex((marker) => {
            return marker.lat === pointedPosition.lat && marker.lng === pointedPosition.lng;
        });
        handleMarkerOnClick(positionIndex);
    }, [pointedPosition]);

    return { 
        center, 
        errorMapLoad,
        googleMapOnLoad,
        handleMarkerOnClick,
        handleInfoWindowOnClose,
        handleResetOnClick,
        infoWindowIsOpen,
        isMapLoaded, 
        mapContainerStyles,
        markerData,
        markerProps,
        searchBoxRef,
        searchBoxOnLoad,
        searchBoxOnPlacesChanged
    };
};