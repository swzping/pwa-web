module.exports = targets => {
    const veniaTargets = targets.of('@magento/venia-ui');
    const paymentMethods = [
        'snap_akulaku',
        'cashondelivery',
        'snap_bcaklikpay',
        'snap_offline_installment',
        'snap_bni_installment',
        'snap_banktransfer_bni',
        'snap_banktransfer_bca',
        'checkmo',
        'snap',
        'snap_creditcard',
        'snap_banktransfer_permata',

        // new Update
        'snap_banktransfer',
        'banktransfer',
        'snap_mandiri_installment', //pg-installment
        'snap_bca_installment',
        'snap_mandiri_installment_3',
        'snap_mandiri_installment_6',
        'snap_mandiri_installment_12',
        'snap_maybank_installment',
        'snap_bni_installment_3',
        'snap_bni_installment_6',
        'snap_bni_installment_12',
        'snap_creditcardbin', //pg-creditcard
        'snap_cimbclicks', //pg-internetpayment
        'snap_alfamart',
        'snap_indomaret',
        'snap_klikbca',
        'snap_gopay',
        'snap_creditcardbinpromo',
        'snap_creditcardbinpromo_employee',
        'snap_creditcardbinpromo_employee_astra',

        // new update 24/02/2022
        'snap_bri_va',
        'snap_echannel',
        'snap_mandiri_bill_payment',
        'snap_banktransfer_bri'
    ];
    const { specialFeatures } = targets.of('@magento/pwa-buildpack');
    specialFeatures.tap(flags => {
        flags[targets.name] = {
            esModules: true,
            cssModules: true,
            graphqlQueries: true
        };
    });

    const paymentPath = '@icube/pwa-studio-payment/src/components/';

    paymentMethods.map(method =>
        veniaTargets.checkoutPagePaymentTypes.tap(checkoutPagePaymentTypes =>
            checkoutPagePaymentTypes.add({
                paymentCode: method,
                importPath: paymentPath + method
            })
        )
    );
};
