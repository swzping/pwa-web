import React from 'react';
import * as Yup from 'yup';
import { useHistory } from 'react-router-dom';
import { Form } from 'informed';
import Field from '@magento/venia-ui/lib/components/Field';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Button from '@magento/venia-ui/lib/components/Button';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './apotekerLandingPage.module.css';
import { setLoginApoteker, expiredToken } from '../../../../helpers/auth';

const ApotekerLandingPage = () => {

	const classes = useStyle(defaultClasses);
	const history = useHistory();
	const loginPass = 'guard1';

	const msgFieldRequired = {
        id: 'validation.isRequired',
        defaultMessage: 'Is required.'
    };
	const msgFieldMatch = {
        id: 'validation.match',
        defaultMessage: 'Password is wrong'
    };
	const formValidationSchema = Yup.object().shape({
		password: Yup.string().required(msgFieldRequired)
			.test('is-password-match', msgFieldMatch, function (value) {
				return value === loginPass;
			}),
	  });
	const handleSubmit = (value) => {
		if (value.password === loginPass) {
			setLoginApoteker(1, expiredToken);
			history.push('/healthcheck/email-customer');
		}
	}

	return (
		<div className={classes.containerApoteker}>
			<div className={classes.title}>
				<h3>Login Apoteker</h3>
			</div>
			<div className={classes.divPass}>
				<Form
					onSubmit={handleSubmit}
					validationSchema={formValidationSchema}
				>
					<Field id="password" label="Password">
                        <TextInput field="password" type="password" />
                    </Field>
					<div className={classes.action_container}>
						<Button priority="high" type="submit">
							Masuk
						</Button>
					</div>
				</Form>
			</div>
		</div>
	);
};

export default ApotekerLandingPage;