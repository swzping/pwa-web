import React, { useEffect } from 'react';
import { shape, string } from 'prop-types';
import { Form } from 'informed';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { FormattedMessage, useIntl } from 'react-intl';
import { useToasts } from '@magento/peregrine';
import Button from '@magento/venia-ui/lib/components/Button';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { isRequired } from '@magento/venia-ui/lib/util/formValidators';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import { useStyle } from '@magento/venia-ui/lib/classify';

import { useNewsletter } from '../../../../../../../modules/peregrine/talons/Newsletter/useNewsletter';
import { SUBSCRIBE_TO_NEWSLETTER } from '../../../../../../../modules/peregrine/talons/Newsletter/Newsletter.gql';
import defaultClasses from './styles.module.css';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

const Newsletter = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { formatMessage } = useIntl();
    const talonProps = useNewsletter({
        subscribeMutation: SUBSCRIBE_TO_NEWSLETTER
    });
    const [, { addToast }] = useToasts();
    const {
        errors,
        handleSubmit,
        isBusy,
        setFormApi,
        newsLetterResponse
    } = talonProps;

    useEffect(() => {
        if (newsLetterResponse && newsLetterResponse.status) {
            addToast({
                type: 'info',
                message: formatMessage({
                    id: 'newsletter.subscribeMessage',
                    defaultMessage: 'The email address is subscribed.'
                }),
                timeout: 5000
            });
        }
    }, [addToast, newsLetterResponse]);

    const newsletterError = deriveErrorMessage([
        errors.get('subscribeMutation')
    ]);

    useEffect(() => {
        if (newsletterError) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: newsletterError,
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, newsletterError]);

    const buttonLoading = (
        <div
            className="spinner-border text-light spinner-border-sm"
            role="status"
        >
            <span className="visually-hidden">Loading...</span>
        </div>
    );

    return (
        <div className={classes.root}>
            <Form
                className={classes.formFooter}
                getApi={setFormApi}
                onSubmit={handleSubmit}
            >
                <TextInput
                    placeholder={formatMessage({
                        id: 'newsletter.placeholder',
                        defaultMessage: 'Masukan Email'
                    })}
                    autoComplete="email"
                    field="email"
                    validate={isRequired}
                />
                <Button
                    priority="high"
                    type="submit"
                    disabled={isBusy}
                    className={classes.btnFooter}
                >
                    <span className={classes.titleBtn}>
                        {isBusy ? (
                            buttonLoading
                        ) : (
                            <FormattedMessage
                                id={'newsletter.subscribeText'}
                                defaultMessage={'Subscribe'}
                            />
                        )}
                    </span>
                </Button>
            </Form>
        </div>
    );
};

export default Newsletter;

Newsletter.propTypes = {
    classes: shape({
        root: string,
        modal_active: string,
        formFooter: string,
        btnFooter: string,
        titleBtn: string
    })
};
