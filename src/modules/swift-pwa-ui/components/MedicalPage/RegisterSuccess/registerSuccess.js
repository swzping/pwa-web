import React from 'react';
import { useHistory } from 'react-router-dom';
import Button from '@magento/venia-ui/lib/components/Button';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '../medicalPage.module.css';

const RegisterSuccess = () => {

	const classes = useStyle(defaultClasses);
	const history = useHistory();

	const handleClick = () => {
		history.push('/medical-test-location');
	}

	return (
		<div className={classes.containerMedical}>
			<div className={classes.iconCheck}>
				<i className={`${classes.iconCustom} icon-icon-health-white`} />
			</div>
			<div className={classes.title}>
				<h3>Terimakasih</h3>
				<h3>Anda sudah terdaftar untuk Cek Kesehatan.</h3>
				<h3>Silahkan datang ke Apotek Guardian terdekat</h3>
				<h3>Persediaan terbatas</h3>
			</div>
			<div className={classes.titleSmall}>
				<span>Untuk infromasi toko dan tanggal,</span>
				<span>silahkan klik link dibawah ini.</span>
			</div>
			<div className={classes.btnCms}>
				<Button priority="high" type="submit" onClick={handleClick}>
					Lihat lokasi cek Kesehatan
				</Button>
			</div>
		</div>
	);
};

export default RegisterSuccess;