/* eslint-disable */
/**
 * Custom interceptors for the project.
 *
 * This project has a section in its package.json:
 *    "pwa-studio": {
 *        "targets": {
 *            "intercept": "./local-intercept.js"
 *        }
 *    }
 *
 * This instructs Buildpack to invoke this file during the intercept phase,
 * as the very last intercept to run.
 *
 * A project can intercept targets from any of its dependencies. In a project
 * with many customizations, this function would tap those targets and add
 * or modify functionality from its dependencies.
 */
function localIntercept(targets) {
    targets.of('@magento/pwa-buildpack').transformUpward.tap(def => {
        def.staticFromRoot.inline.body.file.template.inline =
            './venia-static-assets/{{ filename }}';
    });

    const path = require('path');

    // Routes
    targets.of('@magento/venia-ui').routes.tap(routes => {
        // Blog Pages
        routes.push({
            name: 'CategoryPage',
            pattern: '/category',
            path: require.resolve(
                './src/modules/swift-pwa-ui/components/CategoryPage/index.js'
            )
        });
        // Blog Pages
        routes.push({
            name: 'Blog',
            pattern: '/blog',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/Blog/index.js'
            )
        });
        routes.push({
            name: 'BlogPost',
            pattern: '/blog/post/:postUrl?',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/Blog/Post/index.js'
            )
        });
        routes.push({
            name: 'BlogCategory',
            pattern: '/blog/category/:categoryUrl',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/Blog/Category/index.js'
            )
        });
        // coupon Pages
        routes.push({
            name: 'couponList',
            pattern: '/couponList',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/CouponPage/index.js'
            )
        });
        // Milestone Pages
        routes.push({
            name: 'milestone',
            pattern: '/milestone',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/MilestonePage/index.js'
            ),
            "authed": true,
            "redirectTo": "/sign-in"
        });
        // my coupon list Pages
        routes.push({
            name: 'myCouponList',
            pattern: '/myCouponList',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/MyCoupon/index.js'
            ),
            "authed": true,
            "redirectTo": "/sign-in"
        });
        // Brands Pages
        routes.push({
            name: 'Brands',
            pattern: '/brands',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/Brands/index.js'
            )
        });
        // Brands Pages
        // routes.push({
        //     name: 'BrandDetails',
        //     pattern: '/brand/:brandId?/:brandUrl?',
        //     path: path.relative(
        __dirname,
            //         './src/modules/swift-pwa-ui/components/Brands/BrandDetails/index.js'
            //     )
            // });
            // Compare Pages
            routes.push({
                name: 'ComparePage',
                pattern: '/product-compare',
                path: path.relative(
                    __dirname,
                    './src/modules/swift-pwa-ui/components/ComparePage/index.js'
                )
            });
        routes.push({
            name: 'ConfirmPaymentPage',
            pattern: '/confirm-payment',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/ConfirmPaymentPage/index.js'
            )
        });
        // Email Verification Pages
        routes.push({
            name: 'EmailVerificationPage',
            pattern: '/registration/verification/:token?',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/EmailVerificationPage/index.js'
            )
        });
        // Newsletter Pages
        routes.push({
            name: 'Newsletter',
            pattern: '/newsletter',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/NewsletterPage/index.js'
            )
        });
        // Notification Pages
        // routes.push({
        //     name: 'Notification',
        //     pattern: '/notification',
        //     path: path.relative(
        __dirname,
            //         './src/modules/swift-pwa-ui/components/Notification/index.js'
            //     )
            // });
            // Product Reviews Pages
            routes.push({
                name: 'ProductReview',
                pattern: '/product-review',
                path: path.relative(
                    __dirname,
                    './src/modules/swift-pwa-ui/components/ProductReviewPage/index.js'
                ),
                "authed": true,
                "redirectTo": "/sign-in"
            });
        // Referral a friends
        routes.push({
            name: 'ReferralFriend',
            pattern: '/raf',
            path: path.relative(
                __dirname,
                './src/modules/custom-modules/components/ReferralFriend/index.js'
            )
        });
        // Referral a friends Verify
        routes.push({
            name: 'ReferralFriendVerify',
            pattern: '/raf/verify',
            path: path.relative(
                __dirname,
                './src/modules/custom-modules/components/ReferralFriend/rafVerify.js'
            )
        });
        // Reset Password
        routes.push({
            name: 'ResetPasswordPage',
            pattern: '/authentication/resetpassword/:token?',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/ResetPasswordPage/index.js'
            )
        });
        // RewardPoint Pages
        routes.push({
            name: 'RewardPoint',
            pattern: '/reward-points',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/RewardPointPage/index.js'
            ),
            "authed": true,
            "redirectTo": "/sign-in"
        });
        // Store Locator Pages
        routes.push({
            name: 'StoreLocator',
            pattern: '/store-locator',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/StoreLocatorPage/index.js'
            )
        });
        // Store Credit Pages
        routes.push({
            name: 'StoreCredit',
            pattern: '/store-credit',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/StoreCreditPage/index.js'
            ),
            "authed": true,
            "redirectTo": "/sign-in"
        });
        routes.push({
            name: 'my-account-information',
            pattern: '/my-account-information',
            path: path.relative(
                __dirname,
                './src/overrides/venia-ui/components/Header/newMyAccount.js'
            )
        });
        routes.push({
            name: 'qrCode',
            pattern: '/qrCode',
            path: path.relative(
                __dirname,
                './src/overrides/venia-ui/components/Header/components/QrCode/index.js'
            )
        });
        // Order Detail under Account Information
        routes.push({
            name: 'AccountOrderDetail',
            pattern: '/account-information/order/:orderId',
            path: path.relative(
                __dirname,
                './src/overrides/venia-ui/components/AccountInformationPage/orderDetail.js'
            ),
            "authed": true,
            "redirectTo": "/sign-in"
        });
        routes.push({
            name: 'notifitionInfo',
            pattern: '/notification-info',
            path: path.relative(
                __dirname,
                './src/modules/custom-modules/components/CustomAccountInformation/NotifitionInfo.js'
            )
        });
        routes.push({
            name: 'NotifitionInfoDetail',
            pattern: '/notifitionInfo-detail/:publishId',
            path: path.relative(
                __dirname,
                './src/modules/custom-modules/components/CustomAccountInformation/NotifitionInfoDetail.js'
            )
        });
        routes.push({
            name: 'HealthList',
            pattern: '/healthList',
            path: path.relative(
                __dirname,
                './src/modules/custom-modules/components/CustomAccountInformation/HealthList.js'
            )
        });
        routes.push({
            name: 'HealthDetail',
            pattern: '/health-detail/:entityId',
            path: path.relative(
                __dirname,
                './src/modules/custom-modules/components/CustomAccountInformation/HealthDetail.js'
            )
        });
        // Thanks Pages
        routes.push({
            name: 'Thanks',
            pattern: '/thanks/:order',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/ThanksPage/index.js'
            )
        });
        // Swift Customer Account Mobile
        routes.push({
            name: 'CustomerAccount',
            pattern: '/customer/account',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/Customer/Account/index.js'
            )
        });
        // Contact Us
        routes.push({
            name: 'Contact',
            pattern: '/contact',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/ContactPage/index.js'
            )
        });

        // Faq
        routes.push({
            name: 'Faq',
            pattern: '/faq',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/FaqPage/index.js'
            )
        });

        // Order Detail
        routes.push({
            name: 'OrderDetail',
            pattern: '/order/:number',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/OrderDetail/index.js'
            ),
            "authed": true,
            "redirectTo": "/sign-in"
        });

        // Order Return
        routes.push({
            name: 'OrderReturn',
            pattern: '/order-return/:number',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/OrderReturn/index.js'
            ),
            "authed": true,
            "redirectTo": "/sign-in"
        });

        // Setting Page
        routes.push({
            name: 'SettingPage',
            pattern: '/setting',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/SettingPage/index.js'
            ),
            "authed": true,
            "redirectTo": "/sign-in"
        });

        // Apoteker Page
        routes.push({
            name: 'Apoteker',
            pattern: '/healthcheck',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/ApotekerLandingPage/index.js'
            ),
        });
        routes.push({
            name: 'ApotekerEmailCustomer',
            pattern: '/healthcheck/email-customer',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/ApotekerLandingPage/EmailCustomer/index.js'
            ),
        });
        routes.push({
            name: 'ApotekerDataCustomer',
            pattern: '/healthcheck/data-customer/:emailUrl?',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/ApotekerLandingPage/DataCustomer/index.js'
            ),
        });
        routes.push({
            name: 'ApotekerDataCustomerCompleted',
            pattern: '/healthcheck/data-customer/completed',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/ApotekerLandingPage/Completed/index.js'
            ),
        });

        // Medical Page
        routes.push({
            name: 'HealthRegister',
            pattern: '/medical-test/registersuccess',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/MedicalPage/RegisterSuccess/index.js'
            ),
            "authed": true,
            "redirectTo": "/sign-in"
        });
        routes.push({
            name: 'HealthResult',
            pattern: '/medical-test/results',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/MedicalPage/index.js'
            ),
            "authed": true,
            "redirectTo": "/sign-in"
        });

        // Free Gift List Page
        routes.push({
            name: 'FreeGiftList',
            pattern: '/freegift',
            path: require.resolve(
                './src/modules/swift-pwa-ui/components/FreeGift/FreeGiftListPage/index.js'
            )
        });

        // Free Gift Recommendation Page
        routes.push({
            name: 'FreeGiftRecommendation',
            pattern: '/freegift/recommendation',
            path: require.resolve(
                './src/modules/swift-pwa-ui/components/FreeGift/FreeGiftRecommendationPage/index.js'
            )
        });

        // Free Gift Detailed Rules Page
        routes.push({
            name: 'FreeGiftDetailedRules',
            pattern: '/freegift/rules',
            path: require.resolve(
                './src/modules/swift-pwa-ui/components/FreeGift/DetailedRulesPage.js'
            )
        });

        // Offline Event Booking Page
        routes.push({
            name: 'offlineEventBooking',
            pattern: '/offline-event-booking',
            path: require.resolve(
                './src/overrides/venia-ui/components/OfflineEvent/offlineEvent.js'
            )
        });
        // Offline Event Ticket List
        routes.push({
            name: 'offlineEventTicketList',
            pattern: '/offline-ticket-list',
            path: require.resolve(
                './src/overrides/venia-ui/components/OfflineEvent/TicketList/index.js'
            )
        });
        // Offline Event Activity Detail
        routes.push({
            name: 'offlineEventActivityDetail',
            pattern: '/offline-activity-detail',
            path: require.resolve(
                './src/overrides/venia-ui/components/OfflineEvent/ActivityDetail/activityDetail.js'
            )
        });
        // Offline Event Activity Register
        routes.push({
            name: 'offlineEventActivityRegister',
            pattern: '/offline-activity-register',
            path: require.resolve(
                './src/overrides/venia-ui/components/OfflineEvent/ActivityRegister/activityRegister.js'
            )
        });
        // Offline Event Activity Category
        routes.push({
            name: 'offlineEventActivityChooseCategory',
            pattern: '/offline-activity-category',
            path: require.resolve(
                './src/overrides/venia-ui/components/OfflineEvent/ChooseCategory/chooseCategory.js'
            )
        });
        // Offline Event Activity Form
        routes.push({
            name: 'offlineEventActivityForm',
            pattern: '/offline-activity-form',
            path: require.resolve(
                './src/overrides/venia-ui/components/OfflineEvent/ActivityForm/activityForm.js'
            )
        });
        // Offline Event Activity Form Detail
        routes.push({
            name: 'offlineEventActivityFormDetail',
            pattern: '/offline-form-detail',
            path: require.resolve(
                './src/overrides/venia-ui/components/OfflineEvent/ActivityFormDetail/activityFormDetail.js'
            )
        });
        // Benefits Page
        routes.push({
            name: 'Benefits',
            pattern: '/benefits',
            path: path.relative(
                __dirname,
                './src/modules/swift-pwa-ui/components/BenefitsPage/index.js'
            )
        });

        return routes;
    });
}

module.exports = localIntercept;
