import React, { Fragment } from 'react';
import { useIntl } from 'react-intl';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Field from '@magento/venia-ui/lib/components/Field';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Select from '@magento/venia-ui/lib/components/Select';

import { isRequired } from '@magento/venia-ui/lib/util/formValidators';
import defaultClasses from '@magento/venia-ui/lib/components/AccountInformationPage/editForm.module.css';

const Form = props => {
    const { classes: propClasses } = props;
    const { formatMessage } = useIntl();

    const classes = useStyle(defaultClasses, propClasses);

    return (
        <Fragment>
            <div className={classes.root}>
                <div className={classes.email}>
                    <Field
                        id="nickname"
                        label={formatMessage({
                            id: 'review.nickname',
                            defaultMessage: 'Nickname'
                        })}
                    >
                        <TextInput field="nickname" validate={isRequired} />
                    </Field>
                </div>
                <div className={classes.email}>
                    <Field
                        id="title"
                        label={formatMessage({
                            id: 'review.title',
                            defaultMessage: 'Title'
                        })}
                    >
                        <TextInput field="title" validate={isRequired} />
                    </Field>
                </div>
                <div className={classes.email}>
                    <Field
                        id="review"
                        label={formatMessage({
                            id: 'review.review',
                            defaultMessage: 'Review'
                        })}
                    >
                        <TextInput field="detail" validate={isRequired} />
                    </Field>
                </div>
                <div className={classes.email}>
                    <Field
                        id="review"
                        label={formatMessage({
                            id: 'review.ratings',
                            defaultMessage: 'Rating'
                        })}
                    >
                        <Select
                            field="rating"
                            items={[
                                {
                                    key: 1,
                                    label: '1',
                                    value: 1
                                },
                                {
                                    key: 2,
                                    label: '2',
                                    value: 2
                                },
                                {
                                    key: 3,
                                    label: '3',
                                    value: 3
                                },
                                {
                                    key: 4,
                                    label: '4',
                                    value: 4
                                },
                                {
                                    key: 5,
                                    label: '5',
                                    value: 5
                                }
                            ]}
                        />
                    </Field>
                </div>
            </div>
        </Fragment>
    );
};

export default Form;
