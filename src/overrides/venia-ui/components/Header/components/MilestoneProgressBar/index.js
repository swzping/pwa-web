import React, { useEffect, useMemo, useContext, useState } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './index.module.css';
import { ArrowRight } from 'react-feather';
import { Link } from 'react-router-dom';
import DEFAULT_OPERATIONS from '@/modules/swift-pwa-ui/components/MilestonePage/milestonePage.gql.js';
import { useQuery } from '@apollo/client';

const MilestoneProgressBar = () => {
    const classes = useStyle(defaultClasses);

    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

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
    }, [isPhone, resizePhone]);

    const { data: dataInfo } = useQuery(DEFAULT_OPERATIONS.getGamificationCampaign, {
        variables: {},
        fetchPolicy: 'no-cache',
    });

    const stepsList = useMemo(() => {
        const tasksLen = dataInfo?.gamificationCampaign?.tasks?.length || 0;

        const middleCount = Math.max(0, tasksLen - 1);
        const middleSteps = Array.from({ length: middleCount }, (_, i) => `Step ${i + 1}`);
        return ['Start', ...middleSteps, 'Finish'];
    }, [dataInfo]);

    const progressPercent = useMemo(() => {
        return dataInfo?.gamificationCampaign?.campaign_progress_status || 0
    }, [dataInfo]);

    if (dataInfo?.gamificationCampaign?.is_reward_claimed) return null

    return (
        <div className={classes.progressBarContent}>
            <div className={classes.progressHeader}>
                {!isPhone && (<div className={classes.progressText}>Progress</div>)}
                {isPhone && (<img className={classes.milestoneText} src='/venia-static-assets/images/milestone_title_text.png' alt="Milestone" />)}
                {isPhone && (<div className={classes.description}>Complete tasks to unlock exclusive rewards!</div>)}
                <Link to='/milestone' className={classes.viewTasksRow}>
                    <div className={classes.viewTasksText}> View Tasks</div>
                    <ArrowRight color={isPhone ? '#FFFFFF' : '#FF8200'} size={isPhone ? 12 : 18} />
                </Link>
            </div>
            <div className={classes.stepRail}>
                <div className={classes.rail}>
                    <div
                        className={classes.railFill}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className={classes.steps} aria-hidden="true">
                    {stepsList.map((label, idx) => {
                        const stepThreshold = (idx / (stepsList.length - 1)) * 100;
                        const isDone = progressPercent >= stepThreshold;
                        const dotClass = isDone
                            ? `${classes.stepDot} ${classes.stepDotDone}`
                            : classes.stepDot;
                        return (
                            <div key={label} className={classes.step} style={{ opacity: idx === 0 && progressPercent > 0 ? 0 : 1 }}>
                                <div className={dotClass} />
                                {/* <div className={classes.stepText}>{label}</div> */}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div style={{ paddingTop: 20 }}></div>
            {!isPhone && (<div className={classes.progressDesc}>
                <div className={classes.progressLabel}>Complete tasks to unlock exclusive rewards!</div>
            </div>)}
        </div>
    )
}

export default MilestoneProgressBar;
