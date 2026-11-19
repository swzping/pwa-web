import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import * as Yup from 'yup';

import * as Schema from './apotekerLandingPage.gql';

export const getMedicalTestLazy = (variables) => useLazyQuery(Schema.getMedicalTest, {
    variables,
    fetchPolicy: 'no-cache'
});
export const getMedicalTest = (variables) => useQuery(Schema.getMedicalTest, {
    variables,
    fetchPolicy: 'no-cache'
});
export const updateMedicalTest = (variables) => useMutation(Schema.updateMedicalTest, {
    variables,
    context: { request: 'internal' },
});

export default {
	getMedicalTest,
    updateMedicalTest
};