import { gql } from '@apollo/client';

export const GetCityByRegionId = gql`
    query getCityByRegionId($regionId: Int!) {
        getCityByRegionId(region_id: $regionId) {
            item {
                id
                city
                postcode
                __typename
            }
            __typename
        }
    }
`;

export default {
    getCityByRegionIdQuery: GetCityByRegionId, 
}