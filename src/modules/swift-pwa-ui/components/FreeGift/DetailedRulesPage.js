import React, { useEffect, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'react-feather';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import defaultClasses from './DetailedRulesPage.module.css';

const DetailedRulesPage = () => {
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const location = useLocation();
    const { setNavConfig } = useContext(HeaderContext);

    const { eventTime, description } = location.state || {
        eventTime: "2025/11/09 00:00:00 - 2025/12/09 00:00:00",
        description: ""
    };

    // 配置移动端顶部导航
    useEffect(() => {
        setNavConfig({
            showMobileNav: false,
            headerTitle: '',
            redirectHome: false,
            closeIcon: false,
            useCart: false,
            borderBottom: false
        });

        return () => {
            setNavConfig({
                showMobileNav: true,
                headerTitle: '',
                redirectHome: false,
                closeIcon: false,
                useCart: true,
                borderBottom: false
            });
        };
    }, [setNavConfig]);

    const handleBack = () => {
        history.goBack();
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <button className={classes.backButton} onClick={handleBack}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className={classes.title}>Detailed Rules</h1>
            </div>

            <div className={classes.content}>
                <div className={classes.eventTimeSection}>
                    <div className={classes.eventTimeLabel}>Event Time:</div>
                    <div className={classes.eventTimeValue}>{eventTime}</div>
                </div>

                <div className={classes.rulesSection}>
                    <div className={classes.rulesLabel}>Rules Details:</div>
                    <div className={classes.rulesContent}>
                        <div dangerouslySetInnerHTML={{ __html: description }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailedRulesPage;

