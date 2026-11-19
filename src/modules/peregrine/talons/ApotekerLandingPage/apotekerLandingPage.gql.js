import { gql } from '@apollo/client';

export const getMedicalTest = gql`
    query getMedicalTest($customer_email: String) {
      getMedicalTest(customer_email: $customer_email){
        customer_email
		customer_name
		is_register_test
		test_asam_urat_hasil
		test_gula_darah_hasil
		test_kolesterol_hasil
		test_lokasi
		test_tanggal
		test_tekanan_darah_hasil
      }
    }
`;

export const updateMedicalTest = gql`
	mutation updateMedicalTest (
		$customer_email: String,
		$test_tanggal: String,
		$test_lokasi: String,
		$test_gula_darah_hasil: String,
		$test_kolesterol_hasil: String,
		$test_tekanan_darah_hasil: String,
		$test_asam_urat_hasil: String,
	) {
		updateMedicalTest (
			input: {
				customer_email: $customer_email
				test_tanggal: $test_tanggal
				test_lokasi: $test_lokasi
				test_gula_darah_hasil: $test_gula_darah_hasil
				test_kolesterol_hasil: $test_kolesterol_hasil
				test_tekanan_darah_hasil: $test_tekanan_darah_hasil
				test_asam_urat_hasil: $test_asam_urat_hasil
			}
		) {
			message
		}
	}
`;

export default {
	getMedicalTest,
	updateMedicalTest
};