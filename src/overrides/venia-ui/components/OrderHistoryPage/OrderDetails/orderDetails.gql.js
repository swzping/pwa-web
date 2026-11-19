import { gql } from '@apollo/client';

export const GET_INVOICE_URL = gql`
    query GetInvoiceUrl($orderIncrementId: String!) {
        invoiceUrl(order_increment_id: $orderIncrementId)
    }
`;

export default {
    GET_INVOICE_URL
};

