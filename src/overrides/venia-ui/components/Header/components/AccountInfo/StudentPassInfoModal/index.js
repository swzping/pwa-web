import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import classes from './index.module.css';
import Button from '@magento/venia-ui/lib/components/Button';
import { X as Close } from 'react-feather';
import parse from "html-react-parser";


/**
 * props:
 * - open: boolean
 * - onConfirm(code) => Promise
 * - cmsBlocks object
 * - onClose() optional
 */
const StudentPassModal = ({ open, cmsBlocks, quota_message, onConfirm, onClose }) => {


    useEffect(() => {
        if (open) {
        } else {
        }
    }, [open]);




    if (!open) return null;

    return (
        <div className={classes.container} aria-hidden={!open} onClick={() => onClose && onClose()}>
            <div className={classes.card} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className={classes.header}>
                    <span className={classes.title}>{cmsBlocks?.items?.[0]?.title}</span>
                    {/* <Close className={classes.close} onClick={onClose} size={24} color='#1B1A19' style={{ cursor: 'pointer' }} /> */}
                </div>

                <div className={classes.content}>
                    <div className={classes.contentHeaderText}>{parse(quota_message || '')}</div>
                    {/* {
                        studentPassInfo?.promotion_details?.map((item, index) => (
                            <div className={classes.contentText}>{index + 1}.{item}</div>
                        ))
                    } */}
                    {parse(cmsBlocks?.items?.[0]?.content || '')}

                </div>

                <div className={classes.footer}>

                    <Button
                        type="button"
                        onClick={() => onClose && onClose()}
                        className={classes.confirmButton}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div >
    );
};

StudentPassModal.propTypes = {
    open: PropTypes.bool,
    studentPassInfo: PropTypes.shape({
        student_popup_title: PropTypes.string,
        promotion_quota: PropTypes.string,
        promotion_details: PropTypes.array,
    }),
    onConfirm: PropTypes.func,
    onClose: PropTypes.func
};

export default StudentPassModal;
