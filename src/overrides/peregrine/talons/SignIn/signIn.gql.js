import { gql } from '@apollo/client';
import { CheckoutPageFragment } from '@magento/peregrine/lib/talons/CheckoutPage/checkoutPageFragments.gql';

export const GET_CUSTOMER = gql`
    query GetCustomerAfterSignIn {
        customer {
            email
            firstname
            lastname
            is_subscribed
        }
    }
`;

export const SIGN_IN = gql`
    mutation SignIn($email: String!, $password: String!) {
        generateCustomerTokenCustom(
            username: $email
            password: $password
            source: "web"
        ) {
            token
            redirect_after_login
        }
    }
`;

export const REQUEST_OTP_LOGIN = gql`
    mutation requestOtp($phoneNumber: String!) {
        requestOtpLogin(phonenumber: $phoneNumber) {
            info
        }
    }
`;

export const OTP_CONFIG = gql`
    {
        otpConfig {
            otp_enable {
                enable_otp_forgot_password
                enable_otp_login
                enable_otp_register
            }
            otp_expired_time {
                expired_time_otp_forgot_password
                expired_time_otp_login
                expired_time_otp_register
            }
            otp_general_email_required
            otp_length {
                length_otp_forgot_password
                length_otp_login
                length_otp_register
            }
            otp_max_try {
                max_try_otp_forgot_password
                max_try_otp_login
                max_try_otp_register
            }
        }
    }
`;

export const CREATE_CART = gql`
    mutation CreateCartAfterSignIn {
        cartId: createEmptyCart
    }
`;

export const MERGE_CARTS = gql`
    mutation MergeCartsAfterSignIn(
        $sourceCartId: String!
        $destinationCartId: String!
    ) {
        mergeCarts(
            source_cart_id: $sourceCartId
            destination_cart_id: $destinationCartId
        ) @connection(key: "mergeCarts") {
            id
            items {
                id
            }
            ...CheckoutPageFragment
        }
    }
    ${CheckoutPageFragment}
`;


// TIPS: that is new signIn mutation


/** get customer hobbies options  爱好配置*/
export const GET_CUSTOMER_HOBBIES = gql`
    query getCustomerHobbies {
        customerHobbies {        
            items {
                category
                order
                options
            }
        }
    }
`;

export const REFRESH_ACCESS_TOKEN = gql`
    mutation RefreshAccessToken(
        $refresh_token: String!
        ) {
    refreshCustomerAccessToken(
        refresh_token: $refresh_token
    ) {
        status
        message
        access_token
        refresh_token
        expires_in
        customer_token {
            token
        }
    }
    }
`;


/** 保存配置 */
export const SAVE_CUSTOMER_HOBBIES = gql`
    mutation collectCustomerHobbies($hobbies: [CustomerHobbyInput]) { 
        collectCustomerHobbies(
            input: {
                hobbies: $hobbies
            }
        ) {
            status
            message
        }
    }
`;


/** 获取性别配置信息 */
const GET_GENDER_OPTIONS = gql`
    query {
    customAttributeMetadata(
        attributes: [
        {
            attribute_code: "gender"
            entity_type: "1"
        }
        ]
    ) {
        items {
        attribute_code
        attribute_options {
            value
            label
        }
        }
    }
    }
`;


/** 查询用户信息 */
const GET_CUSTOMER_INFO = gql`
query GetCustomerInformation{
    customer{
        id is_register_test ...AccountInformationPageFragment __typename
        }
    }
    fragment AccountInformationPageFragment on Customer{
        id 
        firstname 
        lastname 
        customer_email 
        phonenumber 
        gender
        date_of_birth
        hobbies {
            category
            selectedOptions
        }
        wishlists{
            id 
            items_count 
            sharing_code 
            items_v2{
                items{
                    id ...WishlistItemFragment __typename
                }__typename
            }__typename
        }__typename
    }fragment WishlistItemFragment on WishlistItemInterface{
        id 
        product{
            uid 
            image{
                label url __typename
            }
            url_key 
            name 
            price_range{
                maximum_price{
                    final_price{
                        currency value __typename}discount{amount_off __typename}__typename}__typename}sku stock_status ...on ConfigurableProduct{configurable_options{uid attribute_code attribute_id attribute_id_v2 label values{uid default_label label store_label use_default_value value_index swatch_data{...on ImageSwatchData{thumbnail __typename}value __typename}__typename}__typename}variants{attributes{uid code value_index __typename}product{uid stock_status small_image{url __typename}__typename}__typename}__typename}__typename}...on ConfigurableWishlistItem{configurable_options{id option_label value_id value_label __typename}__typename}__typename}
`;



/** 更新用户信息 */
export const UPDATE_CUSTOMER_INFORMATION = gql`
    mutation SetCustomerInformation(
        $email: String!, 
        $firstname: String!, 
        $lastname: String!, 
        $phonenumber: String, 
        $gender: Int,
        $date_of_birth: String,
        $hobbies: [CustomerHobbyInput],
        $access_token: String
        ) {
        updateCustomerCustom(
            input: {
            email: $email,
            firstname: $firstname, 
            lastname: $lastname, 
            phonenumber: $phonenumber, 
            gender: $gender,
            date_of_birth: $date_of_birth,
            hobbies: $hobbies,
            access_token: $access_token
        }
    ) {
            customer {
                id
        }
        token
        status
        message
    }
    }
`

// 创建账户

export const CREATE_ACCOUNT = gql`
    mutation CreateAccount(
        $email: String!, 
        $firstname: String!, 
        $lastname: String!,
        $phonenumber: String, 
        $is_subscribed: Boolean,
        $gender: Int,
        $date_of_birth: String,
        $access_token: String,
        $request_channel: String
        ) {
    createCustomerCustom(
        input: {
            email: $email,
            firstname: $firstname, 
            lastname: $lastname,
            phonenumber: $phonenumber, 
            is_subscribed: $is_subscribed,
            gender: $gender,
            date_of_birth: $date_of_birth,
            access_token: $access_token,
            request_channel: $request_channel
        }
    ) {
        customer {
        id
        }
        status
        token
        message
    }
    }
`;



// OTP 发送验证码 method: whatshapp | sms
export const REQUEST_PHONE_OTP = gql`
    mutation requestPhoneOTP($phoneId: String!, $method: String!) {
        requestPhoneOTP(phoneId: $phoneId, method: $method) {
            success
            message
        }
    }
`;

export const REQUEST_RESEND_PHONE_OTP = gql`
    mutation requestResendPhoneOTP($phoneId: String!, $method: String!) {
        requestPhoneOTP(phoneId: $phoneId, method: $method) {
            success
            message
        }
    }
`;

// OTP 验证验证码
const VERIFY_PHONE_OTP = gql`
    mutation verifyPhoneOTP($phoneId: String!, $otp: String!, $prev_step: String) {
        verifyPhoneOTP(phoneId: $phoneId, otp: $otp, prev_step: $prev_step) {
            token
            status
            message
            next_step
            lr_data {
                profile {
                    email
                    firstname
                    lastname
                    gender
                    dob
                    phone_number
                }
                access_token
                refresh_token
                expires_in
            }
        }
    }
`;

const VERIFY_PHONE_OTP_V2 = gql`
    mutation verifyPhoneOTPV2($phoneId: String!, $otp: String!) {
        verifyPhoneOTPV2(phoneId: $phoneId, otp: $otp) {
            status
            message
        }
    }
`


/** 发送邮箱验证码 */
export const REQUEST_EMAIL_OTP = gql`
    mutation CheckEmailAvailability($email: String!, $accessToken: String!,$isCheckoutVerify: Boolean) {
    verifyEmail(
        input: {
            email: $email,
            accessToken: $accessToken
            is_checkout_verify: $isCheckoutVerify
        }
    ) {
        status
        message
    }
    }
`;

/** 校验邮箱验证码 */
export const VERIFY_EMAIL_OTP = gql`
    mutation EmailVerificationConfirm(
        $otp: String!, 
        $email: String!
        $isCheckoutVerify: Boolean
        ) {
        confirmEmailVerification(
            input: {
                otp: $otp,
                email: $email
                is_checkout_verify: $isCheckoutVerify
            }
        ) {
            status
            message
        }
    }
`;

/** 邮箱登录 */
const EMAIL_SIGN_IN = gql`
    mutation SignIn($email: String!, $password: String!) {
        generateCustomerTokenCustom(
            username: $email
            password: $password
            source: "web"
        ) {
            token
            status
            message
            next_step
            lr_data {
            profile {
                email
                firstname
                lastname
                gender
                dob
                phone_number
            }
            access_token
            refresh_token
            expires_in
            }
            customer_data {
                id
                firstname
                lastname
                email
                phonenumber
                gender
                date_of_birth
                hobbies {
                    category
                    selectedOptions
                }
            
            }
            __typename
        }
    }
`;

export const BIND_PHONE_NUMBER = gql`
    mutation bindPhoneNumber($phoneId: String!, $method: String!, $access_token: String!) {
        bindPhoneNumber(phoneId: $phoneId, method: $method, access_token: $access_token) {
            success
            message
        }
    }
`

export const BIND_PHONE_NUMBER_V2 = gql`
    mutation bindPhoneNumberV2($phoneId: String!, $method: String!, $access_token: String!) {
        bindPhoneNumberV2(phoneId: $phoneId, method: $method, access_token: $access_token) {
            success
            message
        }
    }
`

export const STORE_CONFIG = gql`
    query StoreConfig {
        storeConfig {
            store_code
            login_radius_sms_enabled
        }
    }
`

// check phone number have password or not
export const PHONE_NUMBER_CHECK = gql`
    mutation PhoneNumberNextStep($phone: String!) {
        phoneNumberNextStep(phoneId: $phone) {
            status
            token
        }
    }
`;

export const LOGIN_BY_PHONE_AND_PASSWORD = gql`
    mutation loginByPhoneAndPassword(
        $phoneNumber: String!
        $password: String!
    ) {
        loginByPhoneAndPassword(
            phoneId: $phoneNumber
            password: $password
        ) {
            token
            status
            message
            next_step
            lr_data {
                profile {
                    email
                    firstname
                    lastname
                    gender
                    dob
                    phone_number
                    __typename
                }
                access_token
                refresh_token
                expires_in
                __typename
            }
            __typename
        }
    }
`

export const ADD_PHONE_PASSWORD = gql`
    mutation addPhonePassword(
        $phone: String!
        $password: String!
        $accessToken: String!
        $prevStep: String
    ) {
        addPhonePassword(
            phoneId: $phone
            password: $password
            access_token: $accessToken
            prev_step: $prevStep
        ) {
            token
            status
            message
            next_step
            lr_data {
                profile {
                    email
                    firstname
                    lastname
                    gender
                    dob
                    phone_number
                    __typename
                }
                access_token
                refresh_token
                expires_in
                __typename
            }
            __typename
        }
    }
`

export const REQUEST_RESET_PASSWORD = gql`
    mutation requestResetPassword($phoneNumber: String!) {
        requestResetPassword(phoneId: $phoneNumber) {
            message
            next_step
            status
            email
        }
    }
`

export const REQUEST_FORGOT_PASSWORD_OTP = gql`
    mutation requestForgotPasswordOtp($phoneNumber: String!, $method: String!) {
        requestForgotPasswordOtp(phoneId: $phoneNumber, method: $method) {
            message
            success
        }
    }
`

export const VERIFY_FORGOT_PASSWORD_OTP = gql`
    mutation verifyForgotPasswordOtp($phoneNumber: String!, $otp: String!) {
        verifyForgotPasswordOtp(phoneId: $phoneNumber, otp: $otp) {
            status
            message
            next_step
            lr_data {
                access_token
                refresh_token
                expires_in
                __typename
            }
            __typename
        }
    }
`
export const GET_CUSTOMER_QR = gql`
    query GetCustomerQr {
        customer {
            qr_code {
                memberId
            }
        }
    }
`;

export default {
    createCartMutation: CREATE_CART,
    getCustomerQuery: GET_CUSTOMER,
    mergeCartsMutation: MERGE_CARTS,
    signInMutation: SIGN_IN,
    otpConfigQuery: OTP_CONFIG,
    getCustomerQr: GET_CUSTOMER_QR,
    requestOtpLoginMutation: REQUEST_OTP_LOGIN,
    // new api
    getCustomerInformation: GET_CUSTOMER_INFO,
    saveCustomerHobbies: SAVE_CUSTOMER_HOBBIES,
    getGednerOptions: GET_GENDER_OPTIONS,
    getCustomerHobbies: GET_CUSTOMER_HOBBIES,
    createAccountMutation: CREATE_ACCOUNT,
    updateCustomerInformation: UPDATE_CUSTOMER_INFORMATION,
    requestPhoneOTP: REQUEST_PHONE_OTP,
    requestResendPhoneOTP: REQUEST_RESEND_PHONE_OTP,
    verifyPhoneOTP: VERIFY_PHONE_OTP,
    verifyPhoneOTPV2: VERIFY_PHONE_OTP_V2,
    requestEmailOTP: REQUEST_EMAIL_OTP,
    verifyEmailOTP: VERIFY_EMAIL_OTP,
    emailSignIn: EMAIL_SIGN_IN,
    refreshAccessToken: REFRESH_ACCESS_TOKEN,
    bindPhoneNumber: BIND_PHONE_NUMBER,
    bindPhoneNumberV2: BIND_PHONE_NUMBER_V2,
    storeConfig: STORE_CONFIG,
    phoneNumberCheck: PHONE_NUMBER_CHECK,
    loginByPhoneAndPassword: LOGIN_BY_PHONE_AND_PASSWORD,
    addPhonePassword: ADD_PHONE_PASSWORD,
    requestResetPassword: REQUEST_RESET_PASSWORD,
    requestForgotPasswordOtp: REQUEST_FORGOT_PASSWORD_OTP,
    verifyForgotPasswordOtp: VERIFY_FORGOT_PASSWORD_OTP
};