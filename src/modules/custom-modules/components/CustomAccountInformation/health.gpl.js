import { gql } from '@apollo/client';

export const GET_HEALTHCHECKS = gql`
query(
        $pageSize:Int,
        $currentPage:Int
){
    getHealthChecks(
        pageSize:$pageSize
        currentPage:$currentPage
    ) {
        total_count
        currentPage
        total_pages
        sort_by{
            code
            direction
        }
        healthchecks{
            entity_id
            is_read
            title
            activity
            check_type
            check_date
        }
    }
}
`;

export const VIEW_HEALTHCHECK = gql`
query(
        $entityId:Int!
){
    viewHealthCheck(
        entity_id:$entityId
    ) {
        entity_id
        ref
        title
        activity
        check_type
        check_date
        phone_number
        gender
        birthday
        customer_name
        blood_pressure
        blood_glucose
        uric_acid
        cholesterol
        cholesterol_hdl
        cholesterol_ldl
        triglyceride
        hemoglobin
        store {
          store_code
          store_name
          store_address
          store_phone
        }
    }
}
`
