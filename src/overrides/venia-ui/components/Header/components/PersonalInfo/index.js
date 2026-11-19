import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './index.module.css';
import { useHistory } from 'react-router-dom';
import SignUpModal from '@/modules/custom-modules/components/Login/signUpModal';
import { useToast } from '@/modules/custom-modules/components/Common/Toast';
import DEFAULT_OPERATIONS from '../../../../../peregrine/talons/SignIn/signIn.gql'
import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import { FormattedMessage, useIntl } from 'react-intl';
import { useAwaitQuery } from '@magento/peregrine/lib/hooks/useAwaitQuery';
import actions from '@magento/peregrine/lib/store/actions/user';
import { useDispatch } from 'react-redux';
import { useUserContext } from '@magento/peregrine/lib/context/user';

const PersonalInfo = props => {
    const [updateCustomerInformationApi, { error: updateCustomerInformationError }] = useMutation(
        DEFAULT_OPERATIONS.updateCustomerInformation,
        {
            fetchPolicy: 'no-cache'
        }
    );
    const [{},{ setToken }] = useUserContext();
    const dispatch = useDispatch();
    const { showToast, showSuccess, showInfo, showError, hideToast } = useToast();

    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);
    const [isLoading, setIsLoading] = useState(false);
    const [initialData, setInitialData] = useState({});
    const [countryCode, setCountryCode] = useState('+62');
    const fetchUserDetails = useAwaitQuery(DEFAULT_OPERATIONS.getCustomerQuery);

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
    }, [isPhone]);



    const { data, loading, error } = useQuery(DEFAULT_OPERATIONS.getCustomerInformation, {
        fetchPolicy: 'no-cache',
    })

    useEffect(() => {
        if (data?.customer) {
            const customer = data.customer;
            console.log('customer', customer)
            const { customer_email, phonenumber, date_of_birth, firstname, gender, hobbies, lastname } = customer;
            const { countryCode, mainNumber } = phonenumber ? splitPhoneNumber(phonenumber) : {}
            countryCode && setCountryCode(countryCode)
            setInitialData({
                email: customer_email,
                date_of_birth,
                firstname,
                lastname,
                gender,
                hobbies,
                phone: mainNumber,
            })
        }
    }, [data])

    /**
     * 拆分电话号码的区号和主号码
     * 支持格式：+62810704984911、62810704984911
     * @param {string} phoneNumber - 完整的电话号码
     * @returns {Object} 包含区号、主号码和原始信息的对象
     */
    const splitPhoneNumber = (phoneNumber) => {
        // 参数验证
        if (!phoneNumber || typeof phoneNumber !== 'string') {
            return {
                countryCode: '',
                mainNumber: '',
                original: phoneNumber || '',
                normalized: '',
                hasPlusPrefix: false,
                isValid: false,
                error: '无效的电话号码输入'
            };
        }

        // 标准化处理：移除所有空格，转字符串
        let normalized = phoneNumber.toString().trim().replace(/\s+/g, '');
        const hasPlusPrefix = normalized.startsWith('+');

        // 如果以+开头，移除+
        if (hasPlusPrefix) {
            normalized = normalized.substring(1);
        }

        // 验证是否为纯数字（移除+号后）
        if (!/^\d+$/.test(normalized)) {
            return {
                countryCode: '',
                mainNumber: '',
                original: phoneNumber,
                normalized: normalized,
                hasPlusPrefix: hasPlusPrefix,
                isValid: false,
                error: '电话号码只能包含数字和+号'
            };
        }

        // 查找可能的区号（这里需要业务逻辑来确定如何拆分）
        // 假设我们知道常见的区号长度，或者通过其他方式获取
        return splitByCountryCode(normalized, phoneNumber, hasPlusPrefix);
    }

    /**
     * 根据可能的区号拆分电话号码
     * 注意：这里需要业务规则来确定区号长度
     * 常见的区号长度：1位(7-俄罗斯)、2位(62-印尼)、3位(852-香港)等
     */
    const splitByCountryCode = (normalized, original, hasPlusPrefix) => {
        // 这里是一个示例逻辑，你需要根据实际业务调整

        // 方法1：假设已知区号（如62）
        // 方法2：根据长度和模式推断（这里简单实现）

        // 常见区号列表（可根据需要扩展）
        const commonCountryCodes = [
            '62',    // 印度尼西亚
        ];

        // 尝试匹配区号（从长到短尝试，避免误匹配）
        const sortedCodes = [...commonCountryCodes].sort((a, b) => b.length - a.length);

        for (const code of sortedCodes) {
            if (normalized.startsWith(code)) {
                const mainNumber = normalized.substring(code.length);

                // 验证主号码的有效性（至少3位）
                if (mainNumber.length >= 3) {
                    return {
                        countryCode: code,
                        mainNumber: mainNumber,
                        original: original,
                        normalized: normalized,
                        hasPlusPrefix: hasPlusPrefix,
                        isValid: true,
                        fullNumberWithPlus: '+' + normalized,
                        formatted: '+' + code + ' ' + formatPhoneNumber(mainNumber)
                    };
                }
            }
        }

        // 如果没有匹配到已知区号，返回原始号码作为主号码
        return {
            countryCode: '',
            mainNumber: normalized,
            original: original,
            normalized: normalized,
            hasPlusPrefix: hasPlusPrefix,
            isValid: true,
            isLocalNumber: true,
            fullNumberWithPlus: hasPlusPrefix ? '+' + normalized : normalized
        };
    }

    /**
     * 格式化电话号码（添加分隔符）
     */
    const formatPhoneNumber = (number) => {
        if (!number) return '';

        // 根据长度决定格式化方式
        if (number.length <= 4) return number;

        // 常见的格式化：3-4-4 或 4-3-4 等
        if (number.length === 10) {
            return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        } else if (number.length === 11) {
            return number.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
        } else {
            // 其他长度保持原样或简单分组
            return number.replace(/(\d{4})(?=\d)/g, '$1-');
        }
    }



    const handleUpdateCustomerInformationApi = async (formData) => {
        const res = await updateCustomerInformationApi({
            variables: formData
        })


        return res
    }

    const handleUpdateUserDetails = async () => {
        const { data } = await fetchUserDetails({
            fetchPolicy: 'no-cache'
        });
        dispatch(actions.getDetails.receive(data.customer));
    }


    const handdleSignUpModalFormSubmit = async formData => {

        const infoData = {
            email: formData.email,
            firstname: formData.firstname,
            lastname: formData.lastname,
            phonenumber: formData.phonenumber,
            hobbies: formData.hobbies,
        };


        if (formData.gender) {
            infoData.gender = formData.gender
        }

        if (formData.date_of_birth) {
            infoData.date_of_birth = formData.date_of_birth
        }

        const res = await handleUpdateCustomerInformationApi(infoData)

        // 更新token
        const token = res?.data?.updateCustomerCustom?.token || '';
        if (token) {
            await setToken(token);
        }
        // update user info
        handleUpdateUserDetails()


        return res?.data?.updateCustomerCustom || {}
    };




    return (
        <div className={classes.pointWrap}>
            <div className={classes.title}>My Profile</div>
            <div className={classes.container}>
                {loading ? (<LoadingIndicator className={classes.loadingIndicator}>
                    <FormattedMessage
                        id={'myAccountPersonallInfo.loadingText'}
                        defaultMessage={'loading...'}
                    />
                </LoadingIndicator>)
                    : (<SignUpModal
                        open={Boolean(initialData.phone)}
                        onNext={handdleSignUpModalFormSubmit}
                        signUpType="personalInfo"
                        initialData={initialData}
                        initialCountry={countryCode}
                    />)}


            </div>
        </div>
    );
};

export default PersonalInfo;
