import React, { useEffect, useRef } from 'react';
import { Form } from 'informed';
import { FormattedMessage, useIntl } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import FormError from '@magento/venia-ui/lib/components/FormError/formError';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import Field from '@magento/venia-ui/lib/components/Field';
import { isRequired } from '@magento/venia-ui/lib/util/formValidators';
import Button from '@magento/venia-ui/lib/components/Button';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import { useToasts } from '@magento/peregrine';
import { useContact } from '../../../talons/Contact/useContact';
import defaultClasses from './contactForm.module.css';

const ContactForm = () => {
    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses);
    const talonProps = useContact();

    const {
        errors,
        handleSubmit,
        isBusy,
        setFormApi,
        contactResponse
    } = talonProps;

    const [, { addToast }] = useToasts();

    useEffect(() => {
        if (contactResponse) {
            addToast({
                type: 'info',
                message: formatMessage({
                    id: 'contact.contactMessage',
                    defaultMessage: 'Your message has been sent'
                }),
                timeout: 5000
            });
        }
    }, [addToast, contactResponse]);

    if (isBusy) {
        return (
            <div className={classes.root}>
                <h2 className={classes.title}>Drop us a message</h2>
                <span className={classes.sub}>
                    Were are always ready to help. Send us a message and we will
                    get back to you soon
                </span>

                <div className={classes.contentContainer}>
                    <Form className={classes.form}>
                        <div className={classes.wrapper}>
                            <div className={classes.fullname}>
                                <Field
                                    label={
                                        <span>
                                            Fullname{' '}
                                            <span style={{ color: 'red' }}>
                                                *
                                            </span>
                                        </span>
                                    }
                                >
                                    <TextInput
                                        autoComplete="fullname"
                                        field="fullname"
                                        validate={isRequired}
                                    />
                                </Field>
                            </div>
                            <div className={classes.email}>
                                <Field
                                    label={
                                        <span>
                                            Email{' '}
                                            <span style={{ color: 'red' }}>
                                                *
                                            </span>
                                        </span>
                                    }
                                >
                                    <TextInput
                                        autoComplete="email"
                                        field="email"
                                        validate={isRequired}
                                    />
                                </Field>
                            </div>
                            <div className={classes.telephone}>
                                <Field
                                    label={
                                        <span>
                                            Telephone{' '}
                                            <span style={{ color: 'red' }}>
                                                *
                                            </span>
                                        </span>
                                    }
                                >
                                    <TextInput
                                        validate={isRequired}
                                        autoComplete="telephone"
                                        field="telephone"
                                    />
                                </Field>
                            </div>
                        </div>
                        <div className={classes.area}>
                            <Field
                                label={
                                    <span>
                                        Message{' '}
                                        <span style={{ color: 'red' }}>*</span>
                                    </span>
                                }
                            >
                                <TextInput
                                    autoComplete="message"
                                    validate={isRequired}
                                    field="message"
                                    placeholder="Your Message..."
                                />
                            </Field>
                        </div>
                        <div className={classes.actions}>
                            <Button
                                priority="high"
                                type="submit"
                                loading={isBusy}
                            >
                                Send
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <h2 className={classes.title}>Drop us a message</h2>
            <span className={classes.sub}>
                Were are always ready to help. Send us a message and we will get
                back to you soon
            </span>

            <div className={classes.contentContainer}>
                <FormError errors={Array.from(errors.values())} />
                <Form
                    className={classes.form}
                    getApi={setFormApi}
                    onSubmit={handleSubmit}
                >
                    <div className={classes.wrapper}>
                        <div className={classes.fullname}>
                            <Field
                                label={
                                    <span>
                                        Fullname{' '}
                                        <span style={{ color: 'red' }}>*</span>
                                    </span>
                                }
                            >
                                <TextInput
                                    autoComplete="fullname"
                                    field="fullname"
                                    validate={isRequired}
                                />
                            </Field>
                        </div>
                        <div className={classes.email}>
                            <Field
                                label={
                                    <span>
                                        Email{' '}
                                        <span style={{ color: 'red' }}>*</span>
                                    </span>
                                }
                            >
                                <TextInput
                                    autoComplete="email"
                                    field="email"
                                    validate={isRequired}
                                />
                            </Field>
                        </div>
                        <div className={classes.telephone}>
                            <Field
                                label={
                                    <span>
                                        Telephone{' '}
                                        <span style={{ color: 'red' }}>*</span>
                                    </span>
                                }
                            >
                                <TextInput
                                    validate={isRequired}
                                    autoComplete="telephone"
                                    field="telephone"
                                />
                            </Field>
                        </div>
                    </div>
                    <div className={classes.area}>
                        <Field
                            label={
                                <span>
                                    Message{' '}
                                    <span style={{ color: 'red' }}>*</span>
                                </span>
                            }
                        >
                            <TextInput
                                autoComplete="message"
                                validate={isRequired}
                                field="message"
                                placeholder="Your Message..."
                            />
                        </Field>
                    </div>
                    <div className={classes.actions}>
                        <Button priority="high" type="submit" loading={isBusy}>
                            Send
                        </Button>
                    </div>
                    {contactResponse ? (
                        <span className={classes.message}>
                            Your message has been sent. We will get back to you
                            shortly!
                        </span>
                    ) : null}
                </Form>
            </div>
        </div>
    );
};

export default ContactForm;
