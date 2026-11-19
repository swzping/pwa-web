/**
 * @fileoverview This file houses functions that can be used for
 * validation of form fields.
 *
 * Note that these functions should return a string error message
 * when they fail, and `undefined` when they pass.
 */

const SUCCESS = undefined;

export const hasLengthAtLeast = (value, values, minimumLength) => {
    const message = {
        id: 'validation.hasLengthAtLeast',
        defaultMessage: 'Must contain more characters',
        value: minimumLength
    };
    if (!value || value.length < minimumLength) {
        return message;
    }

    return SUCCESS;
};

export const hasLengthAtMost = (value, values, maximumLength) => {
    if (value && value.length > maximumLength) {
        const message = {
            id: 'validation.hasLengthAtMost',
            defaultMessage: 'Must have less characters',
            value: maximumLength
        };
        return message;
    }

    return SUCCESS;
};

export const hasLengthExactly = (value, values, length) => {
    if (value && value.length !== length) {
        const message = {
            id: 'validation.hasLengthExactly',
            defaultMessage: 'Does not have exact number of characters',
            value: length
        };
        return message;
    }

    return SUCCESS;
};

/**
 * isRequired is provided here for convenience but it is inherently ambiguous and therefore we don't recommend using it.
 * Consider using more specific validators such as `hasLengthAtLeast` or `mustBeChecked`.
 */
export const isRequired = value => {
    const FAILURE = {
        id: 'validation.isRequired',
        defaultMessage: 'Is required.'
    };

    // The field must have a value (no null or undefined) and
    // if it's a boolean, it must be `true`.
    if (!value) return FAILURE;

    // If it is a number or string, it must have at least one character of input (after trim).
    const stringValue = String(value).trim();
    const measureResult = hasLengthAtLeast(stringValue, null, 1);

    if (measureResult) return FAILURE;
    return SUCCESS;
};

export const mustBeChecked = value => {
    const message = {
        id: 'validation.mustBeChecked',
        defaultMessage: 'Must be checked.'
    };
    if (!value) return message;

    return SUCCESS;
};

export const validateRegionCode = (value, values, countries) => {
    const countryCode = DEFAULT_COUNTRY_CODE;
    const country = countries.find(({ id }) => id === countryCode);

    if (!country) {
        const invalidCountry = {
            id: 'validation.invalidCountry',
            defaultMessage: `Country "${countryCode}" is not an available country.`,
            value: countryCode
        };
        return invalidCountry;
    }
    const { available_regions: regions } = country;

    if (!(Array.isArray(regions) && regions.length)) {
        const invalidRegions = {
            id: 'validation.invalidRegions',
            defaultMessage: `Country "${countryCode}" does not contain any available regions.`,
            value: countryCode
        };
        return invalidRegions;
    }

    const region = regions.find(({ code }) => code === value);
    if (!region) {
        const invalidAbbrev = {
            id: 'validation.invalidAbbreviation',
            defaultMessage: 'That is not a valid state abbreviation.',
            value: value
        };
        return invalidAbbrev;
    }

    return SUCCESS;
};

/**
 * 将验证器包装为带 label 错误信息的版本
 * 支持两种用法：
 *   1. withLabel(validator, label)        - 普通验证器
 *   2. withLabel([validator, ...args])    - 带参数的验证器（如 [hasLengthAtLeast, 8]）
 *
 * @param {Function|Array} validator - 验证函数 或 [验证函数, ...参数]
 * @param {string} [label] - 字段标签（当 validator 为数组时可省略）
 * @returns {Function} 包装后的验证函数
 */
export const withLabel = (validator, label) => {
    // 处理 [validator, ...args] 格式
    const [fn, ...args] = Array.isArray(validator) ? validator : [validator];

    return (value, values) => {
        const result = fn(value, values, ...args);

        if (result && result.defaultMessage) {
            // 如果已经有 label 了，就不重复添加
            if (result.defaultMessage.startsWith(label)) {
                return result;
            }
            return {
                id: 'validation.withLabel',
                defaultMessage: `${label} required`
            };
        }

        return result;
    };
};

export const validateEmail = value => {
    const FAILURE = {
        id: 'validation.validateEmail',
        defaultMessage: 'Invalid email'
    };

    const regExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const emailValue = regExp.test(value);

    // The field must have a value (no null or undefined) and
    // if it's a boolean, it must be `true`.
    if (!emailValue) return FAILURE;

    return SUCCESS;
};

export const validatePassword = value => {
    const count = {
        lower: 0,
        upper: 0,
        digit: 0,
        special: 0
    };

    for (const char of value) {
        if (/[a-z]/.test(char)) count.lower++;
        else if (/[A-Z]/.test(char)) count.upper++;
        else if (/\d/.test(char)) count.digit++;
        else if (/[!@#$%&=?_.,:;\-]/.test(char)) count.special++;
    }

    if (Object.values(count).filter(Boolean).length < 4) {
        const message = {
            id: 'validation.validatePasswordNewest',
            defaultMessage:
                'Password must be at least 8 characters and contains: \nUPPER CASE \nlower case \ndigits(0-9) and special characters(!@#$%&=?_.,:;-)'
        };
        return message;
    }

    return SUCCESS;
};

export const isEqualToField = (value, values, fieldKey) => {
    const message = {
        id: 'validation.isEqualToField',
        defaultMessage: 'Fields must match',
        value: fieldKey
    };
    return value === values[fieldKey] ? SUCCESS : message;
};

export const isNotEqualToField = (value, values, fieldKey) => {
    const message = {
        id: 'validation.isNotEqualToField',
        defaultMessage: 'Fields must be different',
        value: fieldKey
    };
    return value !== values[fieldKey] ? SUCCESS : message;
};

export const validatePhone = value => {
    const FAILURE = {
        id: 'validation.validatePhone',
        defaultMessage: 'Phone number is not valid'
    };

    const regExp = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[0-9]{8,16}$/;
    const phoneValue = regExp.test(value);

    // The field must have a value (no null or undefined) and
    // if it's a boolean, it must be `true`.
    if (!phoneValue) return FAILURE;

    return SUCCESS;
};

export const combineValidators = (validators, customMessage) => {
    return (value, values) => {
        for (const validator of validators) {
            const result = validator(value, values);
            if (result !== SUCCESS) {
                if (customMessage) {
                    return {
                        ...result,
                        ...customMessage
                    };
                }
                return result;
            }
        }
        return SUCCESS;
    };
};

