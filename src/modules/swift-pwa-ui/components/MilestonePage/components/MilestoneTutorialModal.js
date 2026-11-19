import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classes from './MilestoneTutorialModal.module.css';
import Button from '@magento/venia-ui/lib/components/Button';
import { X as Close } from 'react-feather';

const MilestoneTutorialModal = ({
    open,
    onCancel,
    handleGoPage,
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (open) {
            setIsAnimating(true);
        } else {
            setIsAnimating(false);
        }
    }, [open]);

    if (!open) return null;


    const handleConfirm = () => {
        handleGoPage()
    }
    const handleClose = () => {
        onCancel && onCancel();
    };


    return (
        <div className={classes.overlay} role="dialog" aria-modal="true" onClick={handleClose}>
            <div
                className={`${classes.card} ${isAnimating ? classes.cardVisible : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <Close className={classes.closeButton} onClick={handleClose} />

                <div className={classes.header}>
                    <img className={classes.title} src='/venia-static-assets/images/milestone_tutorial_title_text.png' alt="Tutorial" />
                    <div className={classes.description}>How to share Guardian Products to your friends？</div>
                </div>
                <div className={classes.content}>
                    <div className={classes.topText}>Few steps</div>
                    <div className={classes.mainContent}>
                        <div className={classes.infoRowOne}>
                            <div className={classes.infoTitle}>1.Go to Homepage and select your favourite product</div>
                            <div className={classes.infoImgOne}></div>
                        </div>
                        <div className={classes.infoRowOne}>
                            <div className={classes.infoTitle}>2.Click into any Product detail page and click “share” button</div>
                            <div className={classes.infoImgTwo}></div>
                        </div>
                        <div className={classes.infoRowOne}>
                            <div className={classes.infoTitle}>3.Select your best way to share the link directly to your friends</div>
                            <div className={classes.infoImgThree}></div>
                        </div>
                    </div>
                    <div className={classes.footer}>
                        <Button
                            type="button"
                            onClick={handleConfirm}
                            className={classes.confirmButton}
                        >
                            GO TO
                        </Button>

                        <div
                            onClick={handleClose}
                            role="button"
                            tabIndex={0}
                            className={classes.skip}
                        >
                            Skip for now
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

MilestoneTutorialModal.propTypes = {
    open: PropTypes.bool,
    onCancel: PropTypes.func
};

export default MilestoneTutorialModal;
