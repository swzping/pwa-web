import React, { Fragment, useEffect, useState } from 'react';
import { node, shape, string } from 'prop-types';
import { Text as InformedText } from 'informed';
import useFieldState from '@magento/peregrine/lib/hooks/hook-wrappers/useInformedFieldStateWrapper';
import { FormattedMessage } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { FieldIcons, Message } from '@magento/venia-ui/lib/components/Field';
import defaultClasses from '@magento/venia-ui/lib/components/TextInput/textInput.module.css';
import { Info } from 'react-feather';

const TextInput = props => {
    const {
        after,
        before,
        classes: propClasses,
        field,
        message,
        ...rest
    } = props;
    const fieldState = useFieldState(field);
    const classes = useStyle(defaultClasses, propClasses);
    const inputClass = fieldState.error ? classes.input_error : classes.input;

    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

    const resizePhone = () => {
        window.onresize = function () {
            const width = window.innerWidth;
            const newIsPhone = width < 767;
            if (isPhone !== newIsPhone) {
                setIsPhone(newIsPhone);
            }
        };
    };

    useEffect(() => {
        resizePhone();
    }, [isPhone, resizePhone]);

    const renderMessage = () => {
        const msg = fieldState.error || message;
        if (!msg) return null;

        const wrapperStyle = {
            display: 'flex',
            alignItems: 'flex-start',
            color: '#CC2B1E',
            fontSize: 12,
            lineHeight: '12px',
            marginTop: 8,
            gap: 5,
            whiteSpace: 'pre-wrap'
        };

        // msg 是字符串
        if (typeof msg === 'string') {
            return (
                <div style={wrapperStyle} role="alert" aria-live="polite">
                    <Info size={12} />
                    <div>{msg}</div>
                </div>
            );
        }

        // msg 是 formatjs message descriptor: { id, defaultMessage, values/value }
        if (msg && typeof msg === 'object' && msg.id) {
            const { id, defaultMessage, values, value } = msg;
            // 兼容 value（单数/旧格式）和 values（复数/新格式）
            const messageValues = values !== undefined ? values : (value !== undefined ? { value } : undefined);
            return (
                <div style={wrapperStyle} role="alert" aria-live="polite">
                    <Info size={12} />
                    <FormattedMessage id={id} defaultMessage={defaultMessage} values={messageValues}>
                        {text => <div>{text}</div>}
                    </FormattedMessage>
                </div>
            );
        }

        // msg 是 React node（自定义渲染）
        return (
            <div style={wrapperStyle} role="alert" aria-live="polite">
                <Info size={12} />
                <div>{msg}</div>
            </div>
        );
    };

    return (
        <Fragment>
            <FieldIcons after={after} before={before}>
                <InformedText
                    {...rest}
                    className={[inputClass, classes.input_rounded].join(' ')}
                    field={field}
                />
            </FieldIcons>
            {isPhone ? renderMessage() : (<div style={{ whiteSpace: 'pre-wrap' }}><Message fieldState={fieldState}>{message}</Message></div>)}
        </Fragment>
    );
};

export default TextInput;

TextInput.propTypes = {
    after: node,
    before: node,
    classes: shape({
        input: string
    }),
    field: string.isRequired,
    message: node
};

