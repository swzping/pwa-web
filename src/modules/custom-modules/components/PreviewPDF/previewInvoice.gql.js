import { gql } from '@apollo/client';


export const GET_OFFLINE_RECEIPT_DETAIL = gql`
  query GetOfflineReceiptDetail($receiptNo: String!) {
    getOfflineReceiptDetail(receiptNo: $receiptNo) {
      success
      code
      message
      data {
        receiptNo
        pdfUrl
      }
    }
  }
`;
