import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';

import { GOOGLE_MAPS_DEFAULT_POSITION } from '../MapDisplay/useMapDisplay';
import { getStoreLocationsQuery } from './storeLocatorPage.gql';
// import dummyData from './dummyData';

const DEFAULT_RADIUS = 15000;
const DEFAULT_ZOOM = 1;

const rad = (x) => (x * Math.PI) / 180;

const getDistance = (p1, p2) => {
    const R = 6378137; // Earth’s mean radius in meter
    const dLat = rad(p2.lat - p1.lat);
    const dLong = rad(p2.lng - p1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat))
        * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d; // returns the distance in meter
};

const getCoordInfo = (coord) => {
    const address = coord.street ? coord.street[0] : coord.address;
    const fullAddress = address && coord.city ? `${address}. ${coord.city}.` : null;

    return coord.store_name
        ? `
            <h5>${coord.store_name}</h5>
            </br>
            ${fullAddress}
        `
        : fullAddress;
}

function useStoreLocatorPage() {
    const [radius, setRadius] = useState([DEFAULT_RADIUS]);
    const [selectedLocation, setSelectedLocation] = useState({});
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);

    useEffect(() => {
        setZoom(24 - Math.log(radius * 0.621371) / Math.LN2);
    }, [radius]);
    
    const { data, error, loading } = useQuery(getStoreLocationsQuery, {
        fetchPolicy: 'cache-and-network'
    });
    // const data = dummyData.data;
    // const error = null;
    // const loading = false;

    const pointedLocation = useMemo(() => {
        return { 
            lat: Number(selectedLocation.latitude || GOOGLE_MAPS_DEFAULT_POSITION.lat), 
            lng: Number(selectedLocation.longitude || GOOGLE_MAPS_DEFAULT_POSITION.lng),
            isOpen: true,
            info: selectedLocation.info || null
        };
    }, [selectedLocation]);

    const derivedStoreLocationList = useMemo(() => {
        if (data && data.storeLocation && data.storeLocation.items) {
            return data.storeLocation.items
                .map((item) => ({
                    ...item,
                    lat: item.latitude,
                    lng: item.longitude,
                    info: getCoordInfo(item),
                }));
        }
        
        return [];
    }, [data]);

    const filteredStoreLocationList = useMemo(() => {
        if (data && data.storeLocation && data.storeLocation.items) {
            const formattedStoreLocationList = data.storeLocation.items
                .map((item) => ({
                    ...item,
                    lat: item.latitude,
                    lng: item.longitude,
                    info: getCoordInfo(item),
                }));
            
            /**
             * should render all list if :
             * first load (pointedLocation same with default)
             * pointedlocation exist in store list data
             *  */
            const positionExistInStoreList = formattedStoreLocationList.findIndex((position) => {
                return (
                    pointedLocation.lat === Number(position.lat)
                    && pointedLocation.lng === Number(position.lng)
                );
            });
            if (
                (pointedLocation.lat === Number(GOOGLE_MAPS_DEFAULT_POSITION.lat) && pointedLocation.lng === Number(GOOGLE_MAPS_DEFAULT_POSITION.lng))
                || positionExistInStoreList >= 0
            ) return formattedStoreLocationList;

            return formattedStoreLocationList.filter((position) => {
                return getDistance(position, pointedLocation) <= radius;
            });
        }
        
        return [];
    }, [data, radius, pointedLocation]);

    const handleSelectLocation = useCallback(
        (coords) => {
            const latitude = coords.latitude || coords.lat;
            const longitude = coords.longitude || coords.lng;

            if (latitude && longitude) {
                const position = {
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    info: getCoordInfo(coords)
                };
                setSelectedLocation(position);
            }
        },
        [setSelectedLocation, getCoordInfo],
    );

    const radiusOnChange = useCallback(
        value => setRadius(value),
        [setRadius],
    );

    const resetOnClick = useCallback(
        () => {
            setSelectedLocation({});
            setRadius([DEFAULT_RADIUS]);
        },
        [setRadius],
    );
    
    return {
        derivedStoreLocationList, 
        error, 
        filteredStoreLocationList,
        handleSelectLocation,
        loading,
        pointedLocation,
        radius,
        radiusOnChange,
        resetOnClick,
        searchBoxData: process.env.STORELOCATOR_SEARCHBOX_ENABLE === 'true' ? derivedStoreLocationList : null,
        zoom
    };
};

export default useStoreLocatorPage;
