import { useCallback, useState, useRef, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { contactFormMutation } from './contact.gql';

export const useContact = () => {
    const [handling, setHandling] = useState(false);
    const [
        setContactForm,
        { error: contactFormError, data: contactFormData }
    ] = useMutation(contactFormMutation, {
        fetchPolicy: 'no-cache'
    });

    const formApiRef = useRef(null);
    const setFormApi = useCallback(api => (formApiRef.current = api), []);

    const handleSubmit = useCallback(
        async ({ email, fullname, message, telephone }) => {
            setHandling(true);
            try {
                await setContactForm({
                    variables: {
                        email,
                        fullname,
                        message,
                        telephone
                    }
                });
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(error);
                }
            }

            setHandling(false);
        },
        [setContactForm]
    );

    const errors = useMemo(
        () => new Map([['contactFormMutation', contactFormError]]),
        [contactFormError]
    );

    return {
        errors,
        handleSubmit,
        isBusy: handling,
        setFormApi,
        contactResponse:
            contactFormData &&
            contactFormData.contactusFormSubmit.success_message
    };
};
