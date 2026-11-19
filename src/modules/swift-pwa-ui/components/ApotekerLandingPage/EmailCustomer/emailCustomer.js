import React from 'react';
import * as Yup from 'yup';
import { useToasts } from '@magento/peregrine';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { Form } from 'informed';
import Field from '@magento/venia-ui/lib/components/Field';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Button from '@magento/venia-ui/lib/components/Button';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '../apotekerLandingPage.module.css';
import Cookies from 'js-cookie';

import { getMedicalTestLazy } from '../../../../peregrine/talons/ApotekerLandingPage/apotekerLandingPage';

const EmailCustomer = (props) => {

	const isApoteker = Cookies.get('isLoginApoteker');

	const classes = useStyle(defaultClasses);
	const history = useHistory();
	const { formatMessage } = useIntl();
	const [, { addToast }] = useToasts();

	const [_getMedicalTestLazy, { data, error }] = getMedicalTestLazy();

	const handleSubmit = (value) => {
		_getMedicalTestLazy({
			variables: {
				customer_email: value.email,
			},
		});
	};

	React.useEffect(() => {
		if (data) {
			if (data.getMedicalTest.is_register_test !== 1) {
				addToast({
					type: 'error',
					message: 'Email belum teregistrasi',
					timeout: 3000
				});
			} else {
				history.push(`/healthcheck/data-customer/${data.getMedicalTest.customer_email}`);
			}
		}
		if (error) {
			addToast({
				type: 'error',
				message: 'Email belum teregistrasi',
				timeout: 3000
			});
		}
	}, [data, error]);

	const msgFieldRequired = {
        id: 'validation.isRequired',
        defaultMessage: 'Is required.'
    };
	const formValidationSchema = Yup.object().shape({
        email: Yup.string().required(msgFieldRequired),
    });
	
	if (isApoteker !== '1') {
		history.push('/healthcheck');
	}

	return (
		<div className={classes.containerApoteker}>
			<div className={classes.title}>
				<h3>Masukkan Email Customer</h3>
			</div>
			<div className={classes.divPass}>
				<Form
					onSubmit={handleSubmit}
					validationSchema={formValidationSchema}
				>
					<Field
						id="email"
						label={formatMessage({
                            id: 'emailCustomer',
                            defaultMessage: 'Email Customer'
                        })}
					>
                        <TextInput field="email" type="email" />
                    </Field>
					<div className={classes.action_container}>
						<Button priority="high" type="submit">
							Cari
						</Button>
					</div>
				</Form>
			</div>
		</div>
	);
};

export default EmailCustomer;