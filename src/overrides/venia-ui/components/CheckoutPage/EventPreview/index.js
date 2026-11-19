import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@apollo/client';
import { X as Close } from 'react-feather';
import { GET_EVENT_BOOKING_DETAIL, GET_EVENT_RUN_ID } from './eventPreview.gql';
import defaultClasses from './eventPreview.module.css';

// 与 App 端 account_eventbooking/services/util 的 formatThousands 保持一致
export const formatThousands = num => String(num).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * Checkout 页活动预览浮层(移植自 App 端 cart_checkout/atoms/EventPreview):
 * 由 storeConfig 的 dfi_event_booking_checkout_guardian_run_event_id 控制开关,
 * 查询失败自动重试一次,用户可手动关闭(本次会话内不再出现)。
 * H5 位于导航栏下 12px,Web 固定在可视区域右下角 32px。
 * 通过 Portal 挂到 document.body:checkout 根节点在桌面端带
 * transform(translateX 居中),会让 position: fixed 退化为相对该节点定位。
 */
const EventPreview = ({ isPageReady = false, isShow = false }) => {
    const [visible, setVisible] = useState(true);
    const [eventDetailError, setEventDetailError] = useState(false);
    const hasRetriedRef = useRef(false);
    const classes = defaultClasses;

    const { data: storeConfigData } = useQuery(GET_EVENT_RUN_ID, {
        fetchPolicy: 'cache-and-network',
    });
    const run_event_id = storeConfigData?.storeConfig?.dfi_event_booking_checkout_guardian_run_event_id;
    const eventId = String(run_event_id || '').trim();
    const hasValidEventId = eventId.length > 0;

    const { data, refetch: refetchEventDetail, loading: eventDetailLoading, error: eventDetailQueryError } = useQuery(
        GET_EVENT_BOOKING_DETAIL,
        {
            variables: {
                eventId,
            },
            fetchPolicy: 'cache-and-network',
            skip: !hasValidEventId,
        },
    );

    useEffect(() => {
        if (!hasValidEventId || eventDetailLoading || !eventDetailQueryError) {
            return undefined;
        }

        if (hasRetriedRef.current) {
            setEventDetailError(true);
            return undefined;
        }

        hasRetriedRef.current = true;

        const retryEventDetail = async () => {
            try {
                await refetchEventDetail();
                setEventDetailError(false);
            } catch (error) {
                setEventDetailError(true);
            }
        };
        retryEventDetail();
        return undefined;
    }, [eventDetailLoading, eventDetailQueryError, eventId, hasValidEventId, refetchEventDetail]);

    useEffect(() => {
        if (isShow) {
            setVisible(false);
        }
    }, [isShow]);

    const detail = data?.eventBookingDetail || {};
    const categories = detail?.categories || [];
    const hasEventDetailError = Boolean(eventDetailQueryError || eventDetailError);
    const shouldRender = isPageReady && hasValidEventId && !isShow && !hasEventDetailError && categories.length > 0;

    if (!visible) {
        return null;
    }

    return shouldRender
        ? createPortal(
              <div className={classes.root}>
                  <div className={classes.header}>
                      <div className={classes.brand}>
                          <img
                              className={classes.brandImage}
                              src="/venia-static-assets/images/offlineBooking/eventPreviewBrand.svg"
                              alt=""
                          />
                      </div>
                      <div className={classes.copy}>
                          <span className={classes.title}>Event Preview</span>
                          <span className={classes.subtitle}>Limited slots available</span>
                      </div>
                      <button
                          aria-label="Close event preview"
                          className={classes.closeButton}
                          onClick={() => setVisible(false)}
                          type="button"
                      >
                          {/* <span className={classes.close}>×</span> */}
                          <Close size={24} color='#6B7280' />
                      </button>
                  </div>

                  <div className={classes.stats}>
                      {categories.map(category => (
                          <div className={classes.stat} key={category.code || category.label}>
                              <span className={classes.statLabel}>{category.label}:</span>
                              <span className={classes.statValue}>{formatThousands(category.remaining_quota)}</span>
                          </div>
                      ))}
                  </div>
              </div>,
              document.body,
          )
        : null;
};

export default EventPreview;
