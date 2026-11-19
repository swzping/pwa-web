import React from 'react';
import { string, bool, shape, func } from 'prop-types';
import { Eye, EyeOff } from 'react-feather';
import { useIntl } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { usePassword } from '@magento/peregrine/lib/talons/Password/usePassword';

import Button from '@magento/venia-ui/lib/components/Button';
import Field from '@magento/venia-ui/lib/components/Field';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import { isRequired } from '@magento/venia-ui/lib/util/formValidators';

import defaultClasses from '@magento/venia-ui/lib/components/Password/password.module.css';

const Password = props => {
    const {
        classes: propClasses,
        label,
        fieldName,
        isToggleButtonHidden,
        autoComplete,
        validate,
        isRequired,
        ...otherProps
    } = props;

    const talonProps = usePassword();
    const { handleBlur, togglePasswordVisibility, visible } = talonProps;
    const classes = useStyle(defaultClasses, propClasses);

    const handleKeypress = e => {
        if (e.code == 'Enter') {
            togglePasswordVisibility;
        }
    };
    const { formatMessage } = useIntl();
    const hidePassword = formatMessage({
        id: 'password.hide',
        defaultMessage: 'Hide Password'
    });
    const viewPassword = formatMessage({
        id: 'password.view',
        defaultMessage: 'View Password'
    });
    const speak = visible ? hidePassword : viewPassword;

    const passwordButton = (
        <Button
            className={classes.passwordButton}
            onClick={togglePasswordVisibility}
            onKeyDown={handleKeypress}
            onKey
            type="button"
        >
            {visible ? (
                <Eye aria-label={speak} color='#474645' size={16} />
            ) : (
                <EyeOff aria-label={speak} color='#474645' size={16} />
            )}
        </Button>
    );

    const fieldType = visible ? 'text' : 'password';

    return (
        <Field id="Password" isRequired={isRequired} label={label} classes={{ root: classes.root }}>
            <TextInput
                after={!isToggleButtonHidden && passwordButton}
                autoComplete={autoComplete}
                field={fieldName}
                type={fieldType}
                validate={validate}
                onBlur={handleBlur}
                {...otherProps}
            />
        </Field>
    );
};

Password.propTypes = {
    autoComplete: string,
    classes: shape({
        root: string
    }),
    label: string,
    fieldName: string,
    isToggleButtonHidden: bool,
    validate: func
};

Password.defaultProps = {
    isToggleButtonHidden: true,
    validate: isRequired
};

export default Password;
