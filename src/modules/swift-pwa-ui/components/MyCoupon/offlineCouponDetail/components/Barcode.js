import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import JsBarcode from 'jsbarcode';
import classes from '../offlineCoupon.module.css';

const Barcode = ({ value }) => {
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (!barcodeRef.current || !value) {
            return;
        }

        JsBarcode(barcodeRef.current, value, {
            format: 'CODE128',
            displayValue: false,
            height: 120,
            margin: 0,
            width: 2,
            lineColor: '#000',
            background: 'transparent',
        });
    }, [value]);

    return <svg className={classes.barcodeImage} ref={barcodeRef} role="img" aria-label={`Voucher barcode for ${value}`} />;
};

Barcode.propTypes = {
    value: PropTypes.string.isRequired,
};

export default Barcode;
