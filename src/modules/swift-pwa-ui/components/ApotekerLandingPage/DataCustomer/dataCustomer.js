import React from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { useToasts } from '@magento/peregrine';
import { useParams } from 'react-router-dom';
import { Form } from 'informed';
import Field from '@magento/venia-ui/lib/components/Field';
import Button from '@magento/venia-ui/lib/components/Button';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '../apotekerLandingPage.module.css';
import Cookies from 'js-cookie';

import { getMedicalTest, updateMedicalTest } from '../../../../peregrine/talons/ApotekerLandingPage/apotekerLandingPage';

const dataCustomer = () => {

	const isApoteker = Cookies.get('isLoginApoteker');
	
	const classes = useStyle(defaultClasses);
	const { formatMessage } = useIntl();
	const history = useHistory();
	const [, { addToast }] = useToasts();
	const { emailUrl = '' } = useParams();

	const [test_tanggal, settest_tanggal] = React.useState('');
	const [test_lokasi, settest_lokasi] = React.useState('');
	const [test_gula_darah_hasil, settest_gula_darah_hasil] = React.useState('');
	const [test_kolesterol_hasil, settest_kolesterol_hasil] = React.useState('');
	const [test_tekanan_darah_hasil, settest_tekanan_darah_hasil] = React.useState('');
	const [test_asam_urat_hasil, settest_asam_urat_hasil] = React.useState('');
	
	const { loading, data } = getMedicalTest({
		customer_email: emailUrl,
	});
	const [_updateMedicalTest] = updateMedicalTest();
	React.useEffect(() => {
		if (data) {
			settest_tanggal(data.getMedicalTest.test_tanggal);
			settest_lokasi(data.getMedicalTest.test_lokasi);
			settest_gula_darah_hasil(data.getMedicalTest.test_gula_darah_hasil);
			settest_kolesterol_hasil(data.getMedicalTest.test_kolesterol_hasil);
			settest_tekanan_darah_hasil(data.getMedicalTest.test_tekanan_darah_hasil);
			settest_asam_urat_hasil(data.getMedicalTest.test_asam_urat_hasil);
		}
	}, [data])

	if (loading) {
		return null
	}
	if (!data || data.getMedicalTest.is_register_test !== 1 || isApoteker !== '1') {
		history.push('/healthcheck');
	}

	const handleSubmit = (value) => {
		const variables = {
			customer_email: emailUrl,
			test_tanggal: test_tanggal,
			test_lokasi: test_lokasi,
			test_gula_darah_hasil: test_gula_darah_hasil || '',
			test_kolesterol_hasil: test_kolesterol_hasil || '',
			test_tekanan_darah_hasil: test_tekanan_darah_hasil || '',
			test_asam_urat_hasil: test_asam_urat_hasil || '',
		};
		_updateMedicalTest({
			variables,
		}).then(() => {
			setTimeout(() => history.push('/healthcheck/data-customer/completed'), 250);
		}).catch((e) => {
			addToast({
				type: 'error',
				message: e.message,
				timeout: 3000
			});
		});
	}
	
	return (
		<>
			{data && (
				<div className={classes.containerApoteker}>
					<div className={classes.title}>
						<h3>{data.getMedicalTest.customer_name}</h3>
						<h5>{data.getMedicalTest.customer_email}</h5>
					</div>
					<div className={`${classes.divPass} _customer`}>
					<Form
							onSubmit={handleSubmit}
						>
							<Field
								id="test_tanggal"
								label={formatMessage({
									id: 'testTanggal',
									defaultMessage: 'Tanggal Tes'
								})}
							>
								<input
									type="date"
									className={classes.inputForm}
									required
									value={test_tanggal}
									onChange={e => settest_tanggal(e.target.value)}
								/>
							</Field>
							<Field
								id="test_lokasi"
								label={formatMessage({
									id: 'testLokasi',
									defaultMessage: 'Lokasi Apotek'
								})}
							>
								<input
									className={classes.inputForm}
									required
									placeholder="XXXX"
									value={test_lokasi}
									onChange={e => settest_lokasi(e.target.value)}
								/>
								<span className={classes.smallNote}>masukkan 4 digit kode toko</span>
							</Field>
							<Field
								id="test_gula_darah_hasil"
								label={formatMessage({
									id: 'testGulaDarah',
									defaultMessage: 'Gula Darah'
								})}
							>
								<input
									className={classes.inputForm}
									value={test_gula_darah_hasil}
									onChange={e => settest_gula_darah_hasil(e.target.value)}
								/>
								<span className={classes.smallInfo}>mg/dL</span>
							</Field>
							<Field
								id="test_asam_urat_hasil"
								label={formatMessage({
									id: 'testAsamUrat',
									defaultMessage: 'Asam Urat'
								})}
							>
								<input
									className={classes.inputForm}
									value={test_asam_urat_hasil}
									onChange={e => settest_asam_urat_hasil(e.target.value)}
								/>
								<span className={classes.smallInfo}>mg/dL</span>
							</Field>
							<Field
								id="test_kolesterol_hasil"
								label={formatMessage({
									id: 'testKolesterol',
									defaultMessage: 'Kolesterol'
								})}
							>
								<input
									className={classes.inputForm}
									value={test_kolesterol_hasil}
									onChange={e => settest_kolesterol_hasil(e.target.value)}
								/>
								<span className={classes.smallInfo}>mg/dL</span>
							</Field>
							<Field
								id="test_tekanan_darah_hasil"
								label={formatMessage({
									id: 'testTekananDarah',
									defaultMessage: 'Tekanan Darah'
								})}
							>
								<input
									className={classes.inputForm}
									value={test_tekanan_darah_hasil}
									onChange={e => settest_tekanan_darah_hasil(e.target.value)}
								/>
								<span className={classes.smallInfo}>mmHg</span>
							</Field>
							<div className={`${classes.action_container} _save`}>
								<Button priority="high" type="submit">
									Simpan
								</Button>
							</div>
						</Form>
					</div>
				</div>
			)}
		</>
	);
};

export default dataCustomer;