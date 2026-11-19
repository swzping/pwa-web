import React from 'react';
import { Circle } from '@react-google-maps/api';
import { Form } from 'informed';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';

import useStoreLocatorPage from '../../../peregrine/talons/StoreLocatorPage/useStoreLocatorPage';
import MapDisplay from '../MapDisplay/mapDisplay';

import StoreList from './storeList';

function StoreLocatorPage() {
    const {
        derivedStoreLocationList,
        error,
        filteredStoreLocationList,
        handleSelectLocation,
        loading,
        pointedLocation,
        radius,
        radiusOnChange,
        resetOnClick,
        searchBoxData,
        zoom
    } = useStoreLocatorPage();

    if (loading && !error) {
        return fullPageLoadingIndicator;
    }

    const renderCircles = (
        <>
            <Circle
                center={pointedLocation}
                radius={Number(radius)}
                options={{
                    fillColor: 'grey',
                    strokeColor: 'grey',
                    fillOpacity: 0.5,
                    strokeOpacity: 0,
                }}
            />
            <Circle
                center={pointedLocation}
                radius={Number(radius) / 30}
                options={{
                    fillColor: 'red',
                    fillOpacity: 0.5,
                    strokeOpacity: 0,
                }}
            />
        </>
    );
    
    return (
        <div className="row no-gutters pt-4">
            <div className="col-xs-12 col-sm-4 col-md-4 last-xs first-sm" style={{ width: 680, margin: '0 auto'}}>
                <StoreList
                    storeList={filteredStoreLocationList}
                    totalAllStore={derivedStoreLocationList.length}
                    onClickListItem={handleSelectLocation}
                />
            </div>
            {/* temporarily hidden */}
            {/* <div className="col-xs-12 col-sm-8 col-md-8">
                <Form style={{ height: '100%', paddingBottom: 80 }}>
                    <MapDisplay 
                        center={pointedLocation}
                        enableFilters
                        markers={filteredStoreLocationList}
                        onSelectLocation={handleSelectLocation}
                        pointedPosition={pointedLocation}
                        renderCircles={renderCircles}
                        radius={radius}
                        radiusOnChange={radiusOnChange}
                        resetOnClick={resetOnClick}
                        searchBoxData={searchBoxData}
                        styles={{ height: '50vh', borderRadius: '10px' }}
                        hidePointedPosition
                        zoom={zoom}
                    />
                </Form>
            </div> */}
        </div>
    )
};

export default StoreLocatorPage;
