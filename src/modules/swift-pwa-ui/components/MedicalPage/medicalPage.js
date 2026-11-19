import React from 'react';
import { useHistory } from 'react-router-dom';
import Button from '@magento/venia-ui/lib/components/Button';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './medicalPage.module.css';

import { getMedicalTest } from '../../../peregrine/talons/ApotekerLandingPage/apotekerLandingPage';

const MedicalPage = () => {

	const classes = useStyle(defaultClasses);
	const history = useHistory();
	const dataFromLocalStorage = JSON.parse(localStorage.getItem('apollo-cache-persist-default'));

	const { loading, data } = getMedicalTest({
		customer_email: dataFromLocalStorage && dataFromLocalStorage.Customer && dataFromLocalStorage.Customer.email,
	});

	const handleClick = () => {
		history.push('/medical-test-location');
	}

	if (loading) {
		return null
	}
	if (data && data.getMedicalTest && data.getMedicalTest.is_register_test !== 1) {
		return (
			<div className={classes.notFound}>
				<span>Data tidak ditemukan</span>
			</div>
		)
	} else {
		return (
			<>
				{data && (
					<>
						<div className={`${classes.containerMedical} _results`}>
							<div className={classes.iconCheck}>
								<i className={`${classes.iconCustom} icon-icon-health-white`} />
							</div>
							<div className={classes.title}>
								<h3>Hasil Cek Kesehatan</h3>
							</div>
							<div className={`${classes.btnCms} _results`}>
								<Button priority="high" type="submit" onClick={handleClick}>
									Lihat lokasi cek Kesehatan
								</Button>
							</div>
						</div>
						<div className={classes.containerTest}>
							{ data.getMedicalTest.test_tanggal ? (
								<div className="all-info">
									<div className={classes.gridRow}>
										<span>Tanggal</span>
										<span><b>{data.getMedicalTest.test_tanggal || "-"}</b></span>
										<span>Lokasi Apotek</span>
										<span><b>{data.getMedicalTest.test_lokasi || "-"}</b></span>
									</div>
									<div className={classes.gridRow}>
										<span>Gula Darah</span>
										<span><b>{data.getMedicalTest.test_gula_darah_hasil || "-"}</b> mg/dL</span>
									</div>
									<div className={classes.gridRow}>
										<span>Kolesterol</span>
										<span><b>{data.getMedicalTest.test_kolesterol_hasil || "-"}</b> mg/dL</span>
									</div>
									<div className={classes.gridRow}>
										<span>Asam Urat</span>
										<span><b>{data.getMedicalTest.test_asam_urat_hasil || "-"}</b> mg/dL</span>
									</div>
									<div className={`${classes.gridRow} last-child`}>
										<span>Tekanan Darah</span>
										<span><b>{data.getMedicalTest.test_tekanan_darah_hasil || "-"}</b> mg/dL</span>
									</div>
								</div>
							) : (
								<div className="no-info">
									<span>Belum ada hasil tes</span>
								</div>
							)}
						</div>
					</>
				)}
			</>
		);
	}
};

export default MedicalPage;