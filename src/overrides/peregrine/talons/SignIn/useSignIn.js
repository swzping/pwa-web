import { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { useApolloClient, useQuery, useMutation, useLazyQuery } from '@apollo/client';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';
import { clearCartDataFromCache } from '@magento/peregrine/lib/Apollo/clearCartDataFromCache';
import { clearCustomerDataFromCache } from '@magento/peregrine/lib/Apollo/clearCustomerDataFromCache';
import { useGoogleReCaptcha } from '@magento/peregrine/lib/hooks/useGoogleReCaptcha';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useAwaitQuery } from '@magento/peregrine/lib/hooks/useAwaitQuery';
import { retrieveCartId } from '@magento/peregrine/lib/store/actions/cart';

import { getCookies } from '../../../../modules/peregrine/util/cookies';
import COMPARE_OPERATIONS from '../../../../modules/peregrine/talons/Compare/compare.gql';
import { useToast } from '../../../../modules/custom-modules/components/Common/Toast'
import {
    getOAuthAccessExpiryAtMs,
    persistOAuthBundle
} from '../../../../lib/customerSessionToken';
import DEFAULT_OPERATIONS from './signIn.gql';

const AuthNextStep = {
    /** 登录成功 */
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    /** 手机未注册 → 需要注册 */
    SIGN_UP: 'SIGN_UP',
    /** 传统客户 → 完整资料 */
    COMPLETE_PROFILE: 'COMPLETE_PROFILE',
    /** 电子邮件帐户已存在 → 需要绑定电话号码 */
    BIND_PHONE: 'BIND_PHONE',
    /** 验证码方式登录 */
    OTP_METHOD: 'OTP_METHOD',
    /** 创建密码 */
    ADD_PASSWORD: 'ADD_PASSWORD',
    /** 创建密码 */
    CREATE_PASSWORD: 'CREATE_PASSWORD',
    /** 重置密码成功 */
    CHANGE_PASSWORD_SUCCESS: 'CHANGE_PASSWORD_SUCCESS'
}

const VerifyStatus = {
    /** 成功 */
    SUCCESS: 'SUCCESS',
    /** 验证码无效 */
    OTP_INVALID: 'OTP_INVALID',
    /** 验证码 过期 */
    OTP_EXPIRED: 'OTP_EXPIRED',
    /** 尝试次数过多/速率限制 */
    TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS'
}

const storage = new BrowserPersistence();

const decodeJwtPayload = token => {
    const parts = token.split('.');

    if (parts.length !== 3) {
        throw new Error('Invalid JWT');
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(paddedBase64);

    return JSON.parse(json);
};


export const useSignIn = props => {
    const {
        getCartDetailsQuery,
        setDefaultUsername,
        showCreateAccount,
        showForgotPassword,
        redirectNotifyMe = ''
    } = props || {};

    const operations = mergeOperations(
        DEFAULT_OPERATIONS,
        COMPARE_OPERATIONS,
        props.operations
    );
    const {
        createCartMutation,
        getCustomerQuery,
        getLocalCompareListProductsQuery,
        mergeCartsMutation,
        mergeCompareListMutation,
        signInMutation,
        requestOtpLoginMutation,
        requestPhoneOTP,
        verifyPhoneOTP,
        getCustomerHobbies,
        createAccountMutation,
        emailSignIn,
        refreshAccessToken,
        bindPhoneNumber,
        updateCustomerInformation,
        loginByPhoneAndPassword,
        addPhonePassword,
        requestResetPassword,
        requestForgotPasswordOtp,
        verifyForgotPasswordOtp,
    } = operations;

    const apolloClient = useApolloClient();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const { showSuccess } = useToast()

    const [
        { cartId },
        { createCart, removeCart, getCartDetails }
    ] = useCartContext();

    const [
        { isGettingDetails, getDetailsError, isRedirect },
        { getUserDetails, getRedirect, setToken, setMemberId }
    ] = useUserContext();

    const [signIn, { data: signInData, error: signInError }] = useMutation(
        signInMutation,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [requestOtpLogin, { error: requestOtpLoginError }] = useMutation(
        requestOtpLoginMutation,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [requestPhoneOTPApi, { error: requestPhoneOTPError }] = useMutation(
        requestPhoneOTP,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [verifyPhoneOTPApi, { data: verifyPhoneData, error: verifyPhoneOTPError }] = useMutation(
        verifyPhoneOTP,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [createAccountMutationApi, { error: createAccountMutationError }] = useMutation(
        createAccountMutation,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [updateCustomerInformationApi, { error: updateCustomerInformationError }] = useMutation(
        updateCustomerInformation,
        {
            fetchPolicy: 'no-cache'
        }
    );


    const [emailSignInApi, { error: emailSignInError }] = useMutation(
        emailSignIn,
        {
            fetchPolicy: 'no-cache'
        }
    );


    const [refreshAccessTokenApi, { error: refreshAccessTokenError }] = useMutation(
        refreshAccessToken,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [bindPhoneNumberApi, { error: bindPhoneNumberError }] = useMutation(
        bindPhoneNumber,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [loginByPhoneAndPasswordApi, { error: loginByPhoneAndPasswordError }] = useMutation(
        loginByPhoneAndPassword,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [addPhonePasswordApi, { error: addPhonePasswordError }] = useMutation(
        addPhonePassword,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [requestResetPasswordApi, { error: requestResetPasswordError }] = useMutation(
        requestResetPassword,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [requestForgotPasswordOtpApi, { error: requestForgotPasswordOtpError }] = useMutation(
        requestForgotPasswordOtp,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [verifyForgotPasswordOtpApi, { error: verifyForgotPasswordOtpError }] = useMutation(
        verifyForgotPasswordOtp,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const {
        generateReCaptchaData,
        recaptchaWidgetProps
    } = useGoogleReCaptcha({
        currentForm: 'CUSTOMER_LOGIN',
        formAction: 'signIn',
    });

    // 注册流程 reCAPTCHA：createCustomerCustom（formAction 全页唯一，避免全局回调注册表覆盖）
    const {
        generateReCaptchaData: generateCreateAccountReCaptchaData
    } = useGoogleReCaptcha({
        currentForm: 'CUSTOMER_CREATE',
        formAction: 'createAccountTalon',
    });

    // 忘记密码 OTP reCAPTCHA：requestForgotPasswordOtp
    const {
        generateReCaptchaData: generateForgotPasswordReCaptchaData
    } = useGoogleReCaptcha({
        currentForm: 'CUSTOMER_FORGOT_PASSWORD',
        formAction: 'forgotPasswordOtp',
    });

    const { client: localClient } = useQuery(getLocalCompareListProductsQuery);

    const [fetchCartId] = useMutation(createCartMutation);
    const [mergeCarts] = useMutation(mergeCartsMutation);
    const [mergeCompareList] = useMutation(mergeCompareListMutation);
    const fetchUserDetails = useAwaitQuery(getCustomerQuery);
    const fetchCartDetails = useAwaitQuery(getCartDetailsQuery);
    const fetchMemberId = useAwaitQuery(DEFAULT_OPERATIONS.getCustomerQr);

    const formApiRef = useRef(null);
    const setFormApi = useCallback(api => (formApiRef.current = api), []);

    const handleSignIn = useCallback(
        async (token, isRedirect = true) => {
            isRedirect && setIsSigningIn(true);
            try {
                // Get guest uid.
                const compareUid = getCookies('uid_compare');

                // Get source cart id (guest cart id).
                const sourceCartId = cartId;

                // Sign in and set the token.
                await setToken(token);
                await setMemberId({fetchMemberId});

                // Clear all cart/customer data from cache and redux.
                // await clearCartDataFromCache(apolloClient);
                await clearCustomerDataFromCache(apolloClient);
                await removeCart();

                // Create and get the customer's cart id.
                await createCart({
                    fetchCartId
                });
                const destinationCartId = await retrieveCartId();

                // Merge the guest cart into the customer cart.
                // await mergeCarts({
                //     variables: {
                //         destinationCartId,
                //         sourceCartId
                //     }
                // });

                if (compareUid) {
                    const mergeCompareListResponse = await mergeCompareList({
                        variables: { uid: compareUid }
                    });

                    const {
                        assignCompareListToCustomer
                    } = mergeCompareListResponse.data;
                    const respCompareListProducts = [];
                    assignCompareListToCustomer.compare_list.items.forEach(
                        ({ product }) => {
                            respCompareListProducts.push(product.sku.toString());
                        }
                    );

                    localClient.writeQuery({
                        query: getLocalCompareListProductsQuery,
                        data: {
                            localCompareListProducts: [...respCompareListProducts]
                        }
                    });
                }

                // Ensure old stores are updated with any new data.
                getUserDetails({ fetchUserDetails });
                getCartDetails({ fetchCartId, fetchCartDetails });

                // 重定向
                if (isRedirect) {
                    getRedirect('/')
                }

                setIsSigningIn(false);
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(error);
                }

                setIsSigningIn(false);
            }
        },
        [
            cartId,
            apolloClient,
            removeCart,
            setToken,
            setMemberId,
            createCart,
            fetchCartId,
            mergeCarts,
            mergeCompareList,
            localClient,
            getUserDetails,
            fetchUserDetails,
            getCartDetails,
            fetchCartDetails
        ]
    );

    const handleSubmit = useCallback(
        async ({ email, password }) => {
            setIsSigningIn(true);
            try {
                // Get guest uid.
                const compareUid = getCookies('uid_compare');

                // Get source cart id (guest cart id).
                const sourceCartId = cartId;

                // Get recaptchaV3 data for login
                const recaptchaData = await generateReCaptchaData();

                // Sign in and set the token.
                const signInResponse = await signIn({
                    variables: { email, password },
                    ...recaptchaData
                });
                const token =
                    signInResponse.data.generateCustomerTokenCustom.token;
                await setToken(token);

                // Clear all cart/customer data from cache and redux.
                // await clearCartDataFromCache(apolloClient);
                await clearCustomerDataFromCache(apolloClient);
                await removeCart();

                // Create and get the customer's cart id.
                await createCart({
                    fetchCartId
                });
                const destinationCartId = await retrieveCartId();

                // Merge the guest cart into the customer cart.
                // await mergeCarts({
                //     variables: {
                //         destinationCartId,
                //         sourceCartId
                //     }
                // });

                if (compareUid) {
                    const mergeCompareListResponse = await mergeCompareList({
                        variables: { uid: compareUid }
                    });

                    const {
                        assignCompareListToCustomer
                    } = mergeCompareListResponse.data;
                    const respCompareListProducts = [];
                    assignCompareListToCustomer.compare_list.items.forEach(
                        ({ product }) => {
                            respCompareListProducts.push(product.sku.toString());
                        }
                    );

                    localClient.writeQuery({
                        query: getLocalCompareListProductsQuery,
                        data: {
                            localCompareListProducts: [...respCompareListProducts]
                        }
                    });
                }

                // Ensure old stores are updated with any new data.
                getUserDetails({ fetchUserDetails });
                getCartDetails({ fetchCartId, fetchCartDetails });
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(error);
                }

                setIsSigningIn(false);
            }
        },
        [
            cartId,
            generateReCaptchaData,
            apolloClient,
            removeCart,
            signIn,
            setToken,
            createCart,
            fetchCartId,
            mergeCarts,
            mergeCompareList,
            localClient,
            getUserDetails,
            fetchUserDetails,
            getCartDetails,
            fetchCartDetails
        ]
    );

    const handleSubmitOtp = useCallback(
        async ({ phonenumber }) => {
            try {
                // Sign in and set the token.
                await requestOtpLoginMutation({
                    variables: { phonenumber }
                });
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(error);
                }

                setIsSigningIn(false);
            }
        },
        [
            cartId,
            apolloClient,
            removeCart,
            signIn,
            setToken,
            createCart,
            fetchCartId,
            mergeCarts,
            getUserDetails,
            fetchUserDetails,
            getCartDetails,
            fetchCartDetails
        ]
    );


    const handleRefreshAccessToken = async (refresh_token) => {
        const result = await refreshAccessTokenApi({
            variables: { refresh_token }
        })
        return result
    }

    // 获取验证码
    const handleRequestPhoneOTPApi = async ({ phoneId, method }) => {
        const recaptchaData = await generateReCaptchaData();
        const pendingPayload = await requestPhoneOTPApi({
            variables: { phoneId, method },
            ...recaptchaData
        });

        return pendingPayload
    }

    const handleVerifyPhoneOTPApi = async ({ phoneId, otp, prev_step }) => {
        const recaptchaData = await generateReCaptchaData();
        const pendingPayload = await verifyPhoneOTPApi({
            variables: { phoneId, otp, prev_step },
            ...recaptchaData
        })
        const { next_step, token, status, lr_data } = pendingPayload.data.verifyPhoneOTP
        if (status === VerifyStatus.SUCCESS && next_step === AuthNextStep.LOGIN_SUCCESS && token) { // 直接登录
            const { access_token, expires_in, refresh_token } = lr_data || {}
            persistOAuthBundle({
                access_token,
                refresh_token,
                expires_in,
            })
            await handleSignIn(token)
        } else { // 有后续操作
            return pendingPayload
        }
    }

    const handleBindPhoneNumber = async ({ phoneId, method, access_token }) => {
        const recaptchaData = await generateReCaptchaData();
        const res = await bindPhoneNumberApi({
            variables: { phoneId, method, access_token },
            ...recaptchaData
        })
        return res
    }

    const handleLoginByPhoneAndPassword = async ({ phoneNumber, password }) => {
        const recaptchaData = await generateReCaptchaData();
        const pendingPayload = await loginByPhoneAndPasswordApi({
            variables: { phoneNumber, password },
            ...recaptchaData
        })
        const { token, next_step, status, lr_data } = pendingPayload.data?.loginByPhoneAndPassword || {}
        if (status === VerifyStatus.SUCCESS && token && next_step === AuthNextStep.LOGIN_SUCCESS) {
            const { access_token, expires_in, refresh_token } = lr_data || {}
            persistOAuthBundle({
                access_token,
                refresh_token,
                expires_in,
            })
            await handleSignIn(token)
        }
        return pendingPayload
    }


    const handleRequestResetPasswordApi = async ({ phoneNumber }) => {
        const pendingPayload = await requestResetPasswordApi({
            variables: { phoneNumber }
        })
        return pendingPayload
    }

    const handleRequestForgotPasswordOtpApi = async ({ phoneNumber, method }) => {
        const recaptchaData = await generateForgotPasswordReCaptchaData();
        const pendingPayload = await requestForgotPasswordOtpApi({
            variables: { phoneNumber, method },
            ...recaptchaData
        })
        return pendingPayload
    }

    const handleVerifyForgotPasswordOtpApi = async ({ phoneNumber, otp }) => {
        const pendingPayload = await verifyForgotPasswordOtpApi({
            variables: { phoneNumber, otp }
        })

        return pendingPayload
    }

    const handleAddPhonePasswordApi = async ({ phone, password, accessToken, prevStep }) => {
        const pendingPayload = await addPhonePasswordApi({
            variables: { phone, password, accessToken, prevStep }
        })
        const { next_step, token, status, message, lr_data } = pendingPayload.data.addPhonePassword
        if (status === VerifyStatus.SUCCESS && next_step === AuthNextStep.LOGIN_SUCCESS && token) { // 直接登录
            if (token) {
               await handleSignIn(token);
            }
            const { access_token, expires_in, refresh_token } = lr_data || {}
            persistOAuthBundle({
                access_token,
                refresh_token,
                expires_in,
            })
        } else { // 有后续操作
            return pendingPayload
        }
    }

    const handleEmailSignInApi = async ({ email, password }) => {
        // Get recaptchaV3 data for login
        const recaptchaData = await generateReCaptchaData();
        const pendingPayload = await emailSignInApi({
            variables: { email, password },
            ...recaptchaData
        })
        const { generateCustomerTokenCustom } = pendingPayload.data || {}
        const { token, next_step, status, lr_data } = generateCustomerTokenCustom || {}

        if (status === VerifyStatus.SUCCESS && token && next_step === AuthNextStep.LOGIN_SUCCESS) {
            const { access_token, expires_in, refresh_token } = lr_data || {}
            persistOAuthBundle({
                access_token,
                refresh_token,
                expires_in
            })
            await handleSignIn(token)
        }

        return pendingPayload
    }

    const handleCreateAccountMutationApi = async (formData) => {
        // Get recaptchaV3 data for registration
        const recaptchaData = await generateCreateAccountReCaptchaData();
        const res = await createAccountMutationApi({
            variables: {
                email: formData.email,
                firstname: formData.firstname,
                lastname: formData.lastname,
                phonenumber: formData.phonenumber,
                is_subscribed: formData.is_subscribed,
                gender: formData.gender,
                date_of_birth: formData.date_of_birth,
                access_token: formData.access_token,
                request_channel: 'OFFI_WEB'
            },
            ...recaptchaData
        })
        const { createCustomerCustom } = res?.data || {}
        if (createCustomerCustom?.status && createCustomerCustom?.token) {
            // 不做自动跳转首页，有后续操作
           await handleSignIn(createCustomerCustom?.token, false)
        }
        return res
    }

    const handleUpdateCustomerInformationApi = async (formData) => {
        const res = await updateCustomerInformationApi({
            variables: formData
        })
        const { updateCustomerCustom } = res?.data || {}
        if (updateCustomerCustom?.status && updateCustomerCustom?.token) {
            // 不做自动跳转首页，有后续操作
            await handleSignIn(updateCustomerCustom?.token, false)
        }
        return res
    }

    const handleForgotPassword = useCallback(() => {
        const { current: formApi } = formApiRef;

        if (formApi) {
            setDefaultUsername(formApi.getValue('email'));
        }

        showForgotPassword();
    }, [setDefaultUsername, showForgotPassword]);

    const handleCreateAccount = useCallback(() => {
        const { current: formApi } = formApiRef;

        if (formApi) {
            setDefaultUsername(formApi.getValue('email'));
        }

        showCreateAccount();
    }, [setDefaultUsername, showCreateAccount]);

    const errors = useMemo(
        () =>
            new Map([
                ['getUserDetailsQuery', getDetailsError],
                ['signInMutation', signInError]
            ]),
        [getDetailsError, signInError]
    );

    // useEffect(async () => {
    //     if (verifyPhoneData?.token && redirectNotifyMe) {
    //         await getRedirect(redirectNotifyMe.replace('?redirect=/', ''));
    //     } else if (verifyPhoneData?.token && !redirectNotifyMe) {
    //         const redirect = '/';
    //         await getRedirect(redirect);
    //     }
    // }, [getRedirect, verifyPhoneData]);

    useEffect(async () => {
        if (signInData && redirectNotifyMe) {
            await getRedirect(redirectNotifyMe.replace('?redirect=/', ''));
        } else if (signInData && !redirectNotifyMe) {
            const redirect = signInData.generateCustomerTokenCustom && signInData.generateCustomerTokenCustom.redirect_after_login ?
                signInData.generateCustomerTokenCustom.redirect_after_login : '/';
            await getRedirect(redirect);
        }
    }, [getRedirect, signInData]);

    return {
        errors,
        handleCreateAccount,
        handleForgotPassword,
        handleSubmit,
        handleSignIn,
        handleRequestPhoneOTPApi,
        handleVerifyPhoneOTPApi,
        handleRefreshAccessToken,
        getCustomerHobbies,
        handleCreateAccountMutationApi,
        handleUpdateCustomerInformationApi,
        handleEmailSignInApi,
        handleBindPhoneNumber,
        handleSubmitOtp,
        // isBusy: isGettingDetails || isSigningIn,
        isBusy: isSigningIn,
        setFormApi,
        AuthNextStep,
        VerifyStatus,
        recaptchaWidgetProps,
        generateReCaptchaData,
        handleLoginByPhoneAndPassword,
        handleAddPhonePasswordApi,
        handleRequestForgotPasswordOtpApi,
        handleVerifyForgotPasswordOtpApi,
        handleRequestResetPasswordApi
    };
};

export const useSignInCommon = props => {
    const { showInfo } = useToast()

    // phoneNumberCheck 的 reCAPTCHA 数据由调用方传入：本 hook 会被多处同时实例化，内部不可再建 reCAPTCHA 实例
    const { generateReCaptchaData: generateCheckPhoneNumberReCaptchaData } = props || {};

    const [refreshAccessTokenApi, { error: refreshAccessTokenError }] = useMutation(
        DEFAULT_OPERATIONS.refreshAccessToken,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [phoneNumberCheckApi, { error: phoneNumberCheckError }] = useMutation(
        DEFAULT_OPERATIONS.phoneNumberCheck,
        {
            fetchPolicy: 'no-cache'
        }
    );


    const [
        getStoreConfig,
        {
            data: storeConfigData,
            loading: storeConfigDataLoading,
            error: storeConfigDataError
        }
    ] = useLazyQuery(DEFAULT_OPERATIONS.storeConfig, { fetchPolicy: 'network-only' });

    const handleCheckPhoneNumber = async phone => {
        try {
            const recaptchaData = (await generateCheckPhoneNumberReCaptchaData?.()) || {};
            const res = await phoneNumberCheckApi({
                variables: { phone },
                ...recaptchaData,
            });

            const result = res?.data?.phoneNumberNextStep;
            if (!result?.status || !result?.token) {
                throw new Error('Invalid phone login response');
            }
            const payload = decodeJwtPayload(result.token);

            return payload?.next_step === 'PASSWORD';
        } catch (error) {
            showInfo(error.message);
            return;
        }
    };

    const handleStoreConfig = async () => {
        try {
            const storeConfig = await getStoreConfig()

            return storeConfig?.data?.storeConfig?.login_radius_sms_enabled || false
        } catch (error) {
            showInfo(error.message)
            return false
        }
    };
    const handleRefreshAccessTokenApi = async (refreshToken) => {
        if (!refreshToken) return { status: false, access_token: '' }

        try {
            const res = await refreshAccessTokenApi({
                variables: { refresh_token: refreshToken }
            })

            const data = res?.data || {}
            const {
                status,
                message,
                access_token,
                refresh_token,
                expires_in,
                customer_token
            } = data?.refreshCustomerAccessToken || {}

            if (status) {
                persistOAuthBundle({
                    access_token,
                    refresh_token,
                    expires_in,
                    customer_token
                })
                return { status: true, access_token }
            } else {
                showInfo(message)
                return { status: false, access_token }
            }
        } catch (error) {
            showInfo(error.message)
            return { status: false, access_token: '' }
        }
    }

    const setRefreshToken = refreshToken => {
        if (!refreshToken) return
        persistOAuthBundle({ refresh_token: refreshToken })
    }

    const removeRefreshToken = () => {
        storage.removeItem('refresh_token')
    }


    const getRefreshToken = () => {
        return storage.getItem('refresh_token')
    }

    const getAccessToken = async () => {

        let access_token = storage.getItem('access_token')

        const expMs = getOAuthAccessExpiryAtMs()
        if (expMs != null && Date.now() >= expMs) {
            removeAccessToken()
            const refresh_token = getRefreshToken()
            const { status, access_token: new_access_token } =
                await handleRefreshAccessTokenApi(refresh_token)
            access_token = status ? new_access_token : ''
        }

        return access_token || ''
    }

    const setAccessToken = (access_token, expires_in) => {
        if (!access_token) return
        persistOAuthBundle({ access_token, expires_in })
    }

    const removeAccessToken = () => {
        removeAccessTokenExpiresIn()
        storage.removeItem('access_token')
        storage.removeItem('customer_token')
    }

    const removeAccessTokenExpiresIn = () => {
        return storage.removeItem('access_token_expires_in')
    }


    return {
        setRefreshToken,
        getRefreshToken,
        removeRefreshToken,
        getAccessToken,
        setAccessToken,
        removeAccessToken,
        handleStoreConfig,
        handleCheckPhoneNumber
    }
}