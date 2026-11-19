import React, { useEffect, useState, useCallback, useRef } from 'react';

const convertUTCToIndonesia = dateValue => {
    try {
        const indonesiaTime = new Date(
            new Date(dateValue).getTime() + 7 * 60 * 60 * 1000
        );

        return indonesiaTime;
    } catch (e) {
        return null;
    }
};

const getIndonesiaTimeNow = () => {
    // Get current UTC time
    const now = new Date();
    // Get UTC timestamp
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
    // Add 7 hours for Indonesia timezone (UTC+7)
    const indonesiaTime = new Date(utcTime + 7 * 60 * 60 * 1000);
    return indonesiaTime;
};

export const useSimpleCountdown = (specialFromDate, specialToDate) => {
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
        isFinished: false
    });

    const animationFrameRef = useRef(null);
    const lastUpdateRef = useRef(Date.now());

    const calculateTimeLeft = useCallback(() => {
        const targetTimeObj = convertUTCToIndonesia(specialToDate);
        // 增加空值检查
        if (!targetTimeObj) {
            return {
                hours: 0,
                minutes: 0,
                seconds: 0,
                isFinished: true
            };
        }
        const targetTime = targetTimeObj.getTime();
        const currentTime = getIndonesiaTimeNow().getTime();
        const difference = targetTime - currentTime;

        if (difference <= 0) {
            localStorage.setItem('savaIsEnd', true);
            return {
                hours: 0,
                minutes: 0,
                seconds: 0,
                isFinished: true
            };
        }

        const totalSeconds = Math.floor(difference / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        localStorage.setItem('savaIsEnd', '');
        return {
            hours,
            minutes,
            seconds,
            isFinished: false
        };
    }, [specialToDate]);

    const updateCountdown = useCallback(() => {
        const now = Date.now();
        // 每秒更新一次，避免过于频繁的更新
        if (now - lastUpdateRef.current >= 1000) {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            lastUpdateRef.current = now;

            // 如果倒计时结束，停止动画帧
            if (newTimeLeft.isFinished) {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                return;
            }
        }

        // 继续下一帧
        animationFrameRef.current = requestAnimationFrame(updateCountdown);
    }, [calculateTimeLeft]);

    useEffect(() => {
        // 初始计算
        setTimeLeft(calculateTimeLeft());

        // 启动动画帧循环
        animationFrameRef.current = requestAnimationFrame(updateCountdown);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [calculateTimeLeft, updateCountdown]);

    return timeLeft;
};

const TOTAL_TIME = 60; // 60秒 = 1分钟

export const useFiveMinuteCountdown = () => {
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

    const endTimeRef = useRef(0);
    const timerRef = useRef(null);

    const clear = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const tick = useCallback(() => {
        const remainingSeconds = Math.max(
            Math.ceil((endTimeRef.current - Date.now()) / 1000),
            0
        );

        setTimeLeft(remainingSeconds);

        if (remainingSeconds === 0) {
            clear();
        }
    }, [clear]);

    const reset = useCallback(() => {
        clear();

        endTimeRef.current = Date.now() + TOTAL_TIME * 1000;

        tick(); // immediately tick once

        timerRef.current = setInterval(tick, 1000);
    }, [clear, tick]);

    useEffect(() => {
        reset();

        return clear;
    }, [reset, clear]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return {
        formatCountdown: `${String(minutes).padStart(2, '0')}:${String(
            seconds
        ).padStart(2, '0')}`,
        minutes,
        seconds,
        isFinished: timeLeft === 0,
        reset
    };
};
