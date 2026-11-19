import React, { useEffect, useMemo, useContext, useState } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './milestone.module.css';
import { useHistory } from 'react-router-dom';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import Button from '@magento/venia-ui/lib/components/Button';
import MilestoneAwardModal from './components/MilestoneAwardModal.js'
import MilestoneTutorialModal from './components/MilestoneTutorialModal.js'
import { ChevronLeft, Loader } from 'react-feather';
import DEFAULT_OPERATIONS from './milestonePage.gql.js'
import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import { useToast } from '@/modules/custom-modules/components/Common/Toast';

const MilestonePage = () => {
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const { showSuccess, showInfo } = useToast()
    const { setNavConfig } = useContext(HeaderContext);
    const [openMilestoneAwardModal, setOpenMilestoneAwardModal] = useState(false);
    const [openMilestoneTutorialModal, setOpenMilestoneTutorialModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shareProductInfo, setShareProductInfo] = useState(null);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'Milestone',
            showMobileNav: false,
            useCart: false
        });
    }, [setNavConfig]);

    const { data: dataInfo, refetch } = useQuery(DEFAULT_OPERATIONS.getGamificationCampaign, {
        variables: {},
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    const [claimGamificationVoucherApi, { error: claimGamificationVoucherError }] = useMutation(
        DEFAULT_OPERATIONS.claimGamificationVoucher,
        {
            fetchPolicy: 'no-cache'
        }
    );


    const stepsList = useMemo(() => {
        const tasksLen = dataInfo?.gamificationCampaign?.tasks?.length || 0;

        const middleCount = Math.max(0, tasksLen - 1);
        const middleSteps = Array.from({ length: middleCount }, (_, i) => `Step ${i + 1}`);
        return ['Start', ...middleSteps, 'Finish'];
    }, [dataInfo]);


    const progressPercent = useMemo(() => {
        return dataInfo?.gamificationCampaign?.campaign_progress_status || 0
    }, [dataInfo]);

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

    const goBack = () => {
        history.goBack();
    }

    const handleClaimGamificationVoucher = async () => {
        if (progressPercent !== 100 || dataInfo?.gamificationCampaign?.is_reward_claimed) return

        try {
            setLoading(true)
            const result = await claimGamificationVoucherApi();
            setLoading(false)
            if (result?.data?.claimGamificationVoucher?.success) {
                setOpenMilestoneAwardModal(true)
                refetch()
            } else {
                showInfo(result?.data?.claimGamificationVoucher?.message || 'Claimed failed')
            }
        } catch (error) {
            showInfo(error.message)
            setLoading(false)

        }

    }

    const handleGoTo = item => {
        const taskMap = {
            REGISTER: 'register',
            COMPLETE_PROFILE: 'completeProfile',
            SHOPPING_FIRST: 'shoppingFirst',
            CLAIM_VOUCHER: 'claimVoucher',
            SHARE_PRODUCT: 'shareProduct',
        }
        if (!openMilestoneTutorialModal && item.task_type === taskMap.SHARE_PRODUCT) {
            setOpenMilestoneTutorialModal(true)
            setShareProductInfo(item)
            return
        }

        if (item.task_type === taskMap.COMPLETE_PROFILE) {
            history.push({
                pathname: '/my-account-information',
                state: { tabId: 'personalInfo' }
            });
            return
        }

        const link = item?.action_link;
        if (!link) return;

        try {
            // 判断是否同源：同源则使用 history.push 保持 SPA 导航并添加历史记录
            const url = new URL(link, window.location.href);
            const isSameOrigin = url.origin === window.location.origin;

            if (isSameOrigin) {
                // 使用 pathname + search + hash 以避免推入完整 origin
                const path = `${url.pathname}${url.search || ''}${url.hash || ''}`;
                history.push(path);
            } else {
                // 非同源：在当前窗口添加历史记录并跳转
                // location.assign 会把新页面加入 session history（可按后退返回）
                // window.location.assign(link);
                window.open(link);
            }
        } catch (e) {
            // 解析失败时兜底直接跳转（会在 session history 中增加一条）
            try {
                window.location.assign(link);
            } catch (err) {
                // 最后回退到打开新窗口
                window.open(link);
            }
        }
    };

    return (
        <div className={[classes.page, 'fullPage'].join(' ')}>
            <div className={classes.container}>
                {isPhone && <ChevronLeft onClick={goBack} className={classes.backButton} size={32} color='#212121' />}
                {/* <img src={isPhone ? '/venia-static-assets/images/milestone_points_h5_bg.png' : '/venia-static-assets/images/milestone_points_web_bg.png'} alt="milestonePoints" className={classes.pointsBg} /> */}

                <img className={classes.title} src='/venia-static-assets/images/milestone_title_text.png' alt="milestoneTitle" />
                <div className={classes.subtitle}>
                    Complete tasks to earn points and unlock exclusive rewards.
                </div>

                <div className={classes.card} style={{ marginBottom: 24 }}>
                    <div className={classes.cardInner}>
                        <div className={classes.progressCardHeader}>
                            <div className={classes.progressHeaderRow}>
                                <div>Your Progress</div>
                                <Button className={[classes.claimButton, progressPercent !== 100 || dataInfo?.gamificationCampaign?.is_reward_claimed ? classes.claimButtonDisabled : ''].join(' ')} disabled={loading} onClick={handleClaimGamificationVoucher}>
                                    {loading && <Loader size={10} color="#fff" />}
                                    Claim
                                </Button>
                            </div>
                            <div className={classes.productThumbBox}>
                                <div className={classes.productThumb}>
                                    <img
                                        src={dataInfo?.gamificationCampaign?.banner_url || ''}
                                        alt="Milestone reward"
                                    />
                                </div>
                            </div>
                            <div className={classes.progressHeaderText}>

                                <div className={classes.progressDesc}>
                                    <div className={classes.progressLabel}>Complete All Tasks to Unlock Your Rewards</div>
                                    {/* <div className={classes.progressPercent}>{progressPercent}%</div> */}
                                </div>
                                {isPhone && (<div style={{ paddingTop: 20 }}></div>)}

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
                                                <div key={label} className={classes.step} >
                                                    <div style={{ opacity: idx === 0 && progressPercent > 0 ? 0 : 1 }} className={dotClass} />
                                                    {!isPhone && (<div className={classes.stepText}>{label}</div>)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                {!isPhone && (<div style={{ paddingTop: 43 }}></div>)}

                            </div>
                        </div>
                    </div>
                </div>

                <div className={classes.taskCard}>
                    <div className={classes.taskCardInner}>
                        <div className={classes.taskCardTitle}>
                            Your Tasks
                            <img style={{ marginLeft: 4 }} width={106} height={3} src="/venia-static-assets/images/milestone_Rectangle.png" alt="milestone_Rectangle" />
                        </div>
                        <div className={classes.taskList}>
                            {dataInfo?.gamificationCampaign?.tasks?.map((t, idx) => {
                                const actionClass = t.status === 'completed'
                                    ? `${classes.taskAction} ${classes.taskActionDone}`
                                    : `${classes.taskAction} ${classes.taskActionGo}`;
                                const actionProps = t.status === 'completed'
                                    ? { type: 'button', disabled: true }
                                    : { type: 'button', onClick: () => handleGoTo(t) };

                                return (
                                    <React.Fragment key={t.id}>
                                        <div className={classes.taskRow}>
                                            <div className={classes.taskLeft}>
                                                <div className={classes.taskIcon}>
                                                    {/* {String(idx + 1).padStart(2, '0')} */}
                                                    <img src={t.icon} alt={t.task_id} />
                                                </div>
                                                <div className={classes.taskTexts}>
                                                    <div className={classes.taskName}>{t.label}</div>
                                                </div>
                                            </div>
                                            <button className={actionClass} {...actionProps}>
                                                {t.action?.label || (t.status === 'completed' ? 'Done' : 'Go To')}
                                            </button>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            {!dataInfo?.gamificationCampaign?.tasks?.length && (<div className={classes.noData}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="82"
                                    height="60"
                                    viewBox="0 0 82 60"
                                    fill="none"
                                >
                                    <path
                                        opacity="0.7"
                                        d="M81.1522 22.8341L74.825 14.7647C74.3166 14.1192 73.7196 13.5511 73.0603 13.0734H73.0636H73.057C72.3092 12.5343 71.4826 12.105 70.5937 11.8178L45.9899 4.52946C44.1859 3.942 42.2375 3.942 40.4302 4.52946L14.557 11.8145C13.6616 12.105 12.8252 12.5375 12.0773 13.083H12.0708H12.074C11.418 13.5607 10.8276 14.1224 10.3258 14.7647L3.99852 22.8341C3.31954 23.7024 3.69347 24.9677 4.74309 25.3389L11.9855 27.9049V47.9074C11.9855 48.8822 12.6218 49.7472 13.5599 50.0539L39.7972 58.5945C41.6045 59.182 43.5528 59.182 45.3601 58.5945L71.6007 50.0539C72.5421 49.7472 73.1751 48.8822 73.1751 47.9074V27.9049L80.4142 25.3421C81.4606 24.9709 81.8378 23.7056 81.1588 22.8373L81.1522 22.8341Z"
                                        fill="#FFC080"
                                    />
                                    <path
                                        d="M69.6515 24.752V44.6799C69.6515 45.6511 69.0283 46.5129 68.1068 46.8179L42.3815 55.3267C40.6114 55.9134 38.6988 55.9134 36.9288 55.3267L11.2068 46.8179C10.2853 46.5129 9.66211 45.6511 9.66211 44.6799V24.752"
                                        stroke="#424242"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    <path
                                        d="M39.6572 19.0498V55.7634"
                                        stroke="#424242"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    <path
                                        d="M47.3075 3.05859L67.1228 8.7201C68.7669 9.26371 70.2121 10.2879 71.2728 11.6602L77.4746 19.6984C78.1409 20.5635 77.7729 21.8231 76.7454 22.1943L51.0299 31.449C50.1018 31.7838 49.0677 31.4755 48.4743 30.6899L39.6572 19.0454"
                                        stroke="#424242"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    <path
                                        d="M15.1077 26.7102L2.56491 22.1956C1.53736 21.8277 1.16942 20.5648 1.83568 19.6996L8.03748 11.6615C9.09486 10.2892 10.5401 9.26496 12.1875 8.72135L37.5283 1.92622C39.8519 1.31632 41.3502 1.38592 43.392 1.97594"
                                        stroke="#424242"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    <path
                                        d="M39.6566 19.0498L30.8395 30.6943C30.2462 31.4799 29.2087 31.7882 28.2839 31.4534L19.5762 28.3177"
                                        stroke="#424242"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    <path
                                        d="M9.74805 9.98689L37.028 18.6416C38.7384 19.1852 40.5747 19.1852 42.2851 18.6416L69.5485 9.97363"
                                        stroke="#424242"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                                <div className={classes.noDataText}>
                                    No Data
                                </div>
                            </div>)}
                        </div>
                    </div>
                </div>
            </div>
            <MilestoneAwardModal open={openMilestoneAwardModal} onCancel={() => setOpenMilestoneAwardModal(false)} />
            <MilestoneTutorialModal open={openMilestoneTutorialModal} onCancel={() => setOpenMilestoneTutorialModal(false)} handleGoPage={() => handleGoTo(shareProductInfo)} />
        </div >
    );
};

export default MilestonePage;

