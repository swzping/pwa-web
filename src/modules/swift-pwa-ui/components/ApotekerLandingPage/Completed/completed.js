import React from 'react';
import { useHistory } from 'react-router-dom';
import Button from '@magento/venia-ui/lib/components/Button';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '../apotekerLandingPage.module.css';

const Completed = () => {

	const classes = useStyle(defaultClasses);
	const history = useHistory();

	const handleSubmit = () => {
		history.push('/healthcheck/email-customer');
	}

	return (
		<div className={`${classes.containerApoteker} ${classes.completed}`}>
			<div className={classes.iconCheck}>
				<i className="fa fa-check-circle"></i>
			</div>
			<div className={classes.title}>
				<h3>Data berhasil disimpan</h3>
			</div>
			<div className={classes.action_container}>
				<Button priority="high" type="submit" onClick={handleSubmit}>
					Selesai
				</Button>
			</div>
		</div>
	);
};

export default Completed;