import React, { useState, useEffect } from 'react';
import { useFormApi, useFieldState } from 'informed';
import { useLazyQuery } from '@apollo/client';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import DEFAULT_OPERATIONS from './cityGroup.gql';

const groupingCity = (item) => {
    // grouping city
    const city = {};
    for (let index = 0; index < item.length; index += 1) {
        const element = item[index];
        const collection = element.city.split(', ');
        const name = collection[0].replace(/ /g, '_').toLowerCase();
        if (!city[name]) {
            city[name] = {
                key: collection[0],
                value: collection[0],
                label: collection[0],
                name: collection[0],
                id: element.id,
                city: element.city,
                postcode: element.postcode,
            };
        }
    }

    return Object.values(city);
};

const generateValue = (group, collection, type, element) => {
    const data = group;
    const name = (collection[type === 'district' ? 1 : 2] || '').replace(/ /g, '_').toLowerCase();
    if (!group[name]) {
        if (typeof collection[type === 'district' ? 1 : 2] !== 'undefined') {
            data[name] = {
                id: element.id,
                key: collection[type === 'district' ? 1 : 2],
                value: collection[type === 'district' ? 1 : 2],
                parent: collection[type === 'district' ? 0 : 1],
                label: collection[type === 'district' ? 1 : 2],
                name: collection[type === 'district' ? 1 : 2],
                city: element.city,
                postcode: element.postcode,
            };
        }
    }
    return data;
};

const groupingSubCity = (parent, type, item, additionalOptions = {}) => {
    let group = {};
    for (let index = 0; index < item.length; index += 1) {
        const element = item[index];
        const collection = element.city.split(', ');
        if (type === 'district' && collection[0] === parent) {
            group = generateValue(group, collection, type, element);
        } else if (type === 'village' && collection[1] === parent && additionalOptions.label === collection[0]) {
            group = generateValue(group, collection, type, element);
        }
    }
    return Object.values(group);
};

/**
 * The useCityGroup talon handles logic for:
 *
 *  * Resetting the region field value when the country changes.
 *  * Querying for available cities for a country and rendering them.
 *
 * @param {Object} props
 * @param {string} props.regionIdField
 * @return {CityGroupTalonProps}
 */
export const useCityGroup = props => {
    const { 
        initialValues = {},
        regionIdField = 'region[region_id]',
        cityIdField = 'city',
        districtIdField = 'district',
        subDistrictIdField = 'subdistrict',
    } = props;

    const { getCityByRegionIdQuery } = mergeOperations(DEFAULT_OPERATIONS);

    const [addressState, setAddressState] = useState({
        countries: null,
        allCity: [],
        dropdown: {
            countries: null,
            region: null,
            city: [],
            district: [],
            village: [],
        },
    });

    const cityGroupFields = [
        'city',
        'district',
        'subdistrict',
        'postcode'
    ];

    const formApi = useFormApi();

    const { value: regionId } = useFieldState(regionIdField);
    const { value: cityId } = useFieldState(cityIdField);
    const { value: districtId } = useFieldState(districtIdField);
    const { value: subDistrictId } = useFieldState(subDistrictIdField);

    const [getCityByRegionId, { data, loading }] = useLazyQuery(getCityByRegionIdQuery);
    
    const initialRegionId = initialValues 
        && initialValues.region 
        && initialValues.region['region_id'];
    
    // let respCityData = [];
    // let respDistrictData = [];
    // let respSubDistrictData = [];
    
    // let filteredCityData = [];
    // let filteredDistrictData = [];
    // let filteredSubDistrictData = [];

    useEffect(() => {
        if (regionId && !loading) {
            if (initialRegionId !== regionId) {
                cityGroupFields.forEach(field => formApi.setValue(field, ''));
            }

            getCityByRegionId({
                variables: { regionId },
                skip: !regionId
            })
        }
    }, [regionId]);

    useEffect(() => {
        if(subDistrictId) {
            // const subDistrict = respSubDistrictData.find(item => item.key === subDistrictId);
            const subDistrict = addressState.dropdown.village.find(item => item.key === subDistrictId);
            if(subDistrict) {
                const { postcode } = subDistrict;
                formApi.setValue('postcode', postcode);
            }
        }
    }, [subDistrictId]);

    // coba set city and grouping
    useEffect(() => {
        if (!loading && data && data.getCityByRegionId) {
            const state = { ...addressState};
            if (data.getCityByRegionId.item.length !== 0) {
                state.allCity = data.getCityByRegionId.item;
                state.dropdown.city = groupingCity(data.getCityByRegionId.item);
                setAddressState(state);
            }
        }
    }, [data]);

    // get kecamatan if city change
    React.useMemo(() => {
        const state = { ...addressState };
        if (addressState.allCity && addressState.allCity.length && addressState.allCity.length > 0) {
            const district = groupingSubCity(cityId, 'district', addressState.allCity);
            state.dropdown.district = district;
            setAddressState(state);
        }
    }, [cityId]);

    // get kelurahan if kecamatan change
    React.useMemo(() => {
        const state = { ...addressState };
        if (addressState.allCity && addressState.allCity.length && addressState.allCity.length > 0) {
            if (districtId) {
                const additionalData = {
                    label: cityId
                };
                const village = groupingSubCity(districtId, 'village', addressState.allCity, additionalData);
                state.dropdown.village = village;
                // setAddressState(state);
            }
        }
    }, [districtId]);   
    
    // if(!loading && data && data.getCityByRegionId && data.getCityByRegionId.item) {
    //     data.getCityByRegionId.item.forEach((item) => {
    //         const [city, district, subDistrict] = item.city.split(', ');

    //         if(respCityData.findIndex((item) => item.key === city) === -1) {
    //             respCityData.push({ 
    //                 key: city, 
    //                 label: city, 
    //                 value: city,
    //             });
    //         }
    //         if(respDistrictData.findIndex((item) => item.key === district && item.parent === city) === -1) {
    //             respDistrictData.push({ 
    //                 key: district, 
    //                 parent: city, 
    //                 label: district, 
    //                 value: district,
    //             });
    //         }
    //         if(respSubDistrictData.findIndex((item) => item.key === subDistrict && item.parent === district) === -1) {
    //             respSubDistrictData.push({ 
    //                 key: subDistrict, 
    //                 parent: district, 
    //                 label: subDistrict, 
    //                 value: subDistrict, 
    //                 postcode: item.postcode,
    //             });
    //         }
    //     })
    // }

    // if(cityId) {
    //     filteredDistrictData = [...respDistrictData.filter((item) => item.parent === cityId)];
    // }
    
    // if(districtId) {
    //     filteredSubDistrictData = [...respSubDistrictData.filter((item) => item.parent === districtId)];
    // }

    return {
        loading,
        // cityData: respCityData.length > 0 ? respCityData : filteredCityData,
        cityData: addressState.dropdown.city,
        // districtData: filteredDistrictData,
        districtData: addressState.dropdown.district,
        // subDistrictData: filteredSubDistrictData,
        subDistrictData: addressState.dropdown.village,
    };
};

/** JSDocs type definitions */

/**
 * @typedef {Object} CityGroupTalonProps
 *
 * @property {boolean} loading whether the cities are loading
 * @property {Array<City>} cityData array of formatted cities for the country
 * @property {Array<City>} districtData array of formatted cities for the country
 * @property {Array<City>} subDistrictData array of formatted cities for the country
 *
 */

/**
 * @typedef {Object} City
 *
 * @property {number} key the id of the city
 * @property {String} parent the label of the city
 * @property {String} label the label of the city
 * @property {String} value the value of the city
 * @property {String} postcode the value of the city
 */
