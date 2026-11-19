import { useRef, useEffect } from 'react';

/**
 * 移动端：双指缩放 + 单指拖拽 Hook
 */
const usePinchZoomPan = (
    {
        minScale = 1,
        maxScale = 3,
        moveSpeed = 1.2,
        zoomSpeed = 0.005
    }) => {
    const containerRef = useRef(null);
    const scaleRef = useRef(1);
    const translateRef = useRef({ x: 0, y: 0 });

    const startRef = useRef({ x: 0, y: 0 });
    const startDistanceRef = useRef(0);
    const lastCenterRef = useRef(null);

    const rafRef = useRef(null);
    const pendingRef = useRef(null);

    /* ---------- 工具函数 ---------- */
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    const getDistance = (t) => {
        const dx = t[0].clientX - t[1].clientX;
        const dy = t[0].clientY - t[1].clientY;
        return Math.hypot(dx, dy);
    };

    const getCenter = (t) => ({
        x: (t[0].clientX + t[1].clientX) / 2,
        y: (t[0].clientY + t[1].clientY) / 2
    });

    const getBounds = (scale) => ({
        maxX: (window.innerWidth * (scale - 1)) / 2,
        maxY: (window.innerHeight * (scale - 1)) / 2
    });

    const applyTransform = () => {
        const el = containerRef.current;
        if (!el) return;
        el.style.transform = `
            translate3d(${translateRef.current.x}px, 
                        ${translateRef.current.y}px, 0)
            scale(${scaleRef.current})
        `;
    };
    /* ---------- 事件 ---------- */
    const onTouchStart = (e) => {
        if (e.touches.length === 1) {
            startRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }

        if (e.touches.length === 2) {
            startDistanceRef.current = getDistance(e.touches);
            lastCenterRef.current = getCenter(e.touches);
        }
    };

    const onTouchMove = (e) => {
        if (!e.touches) return;
        if (e.cancelable) e.preventDefault();

        pendingRef.current = e;

        if (rafRef.current) return;

        rafRef.current = requestAnimationFrame(() => {
            const ev = pendingRef.current;
            if (!ev) return;

            /* ===== 双指缩放 ===== */
            if (ev.touches.length === 2) {
                const dist = getDistance(ev.touches);
                const delta = dist - startDistanceRef.current;
                startDistanceRef.current = dist;

                const oldScale = scaleRef.current;

                let nextScale = clamp(
                    oldScale * (1 + delta * zoomSpeed),
                    minScale,
                    maxScale
                );

                const center = getCenter(ev.touches);
                const lastCenter = lastCenterRef.current || center;
                const ratio = nextScale / oldScale;

                translateRef.current.x =
                    (translateRef.current.x - lastCenter.x) * ratio + center.x;

                translateRef.current.y =
                    (translateRef.current.y - lastCenter.y) * ratio + center.y;

                const { maxX, maxY } = getBounds(nextScale);

                translateRef.current.x = clamp(
                    translateRef.current.x,
                    -maxX,
                    maxX
                );
                translateRef.current.y = clamp(
                    translateRef.current.y,
                    -maxY,
                    maxY
                );

                scaleRef.current = nextScale;
                lastCenterRef.current = center;
            }

            /* ===== 单指拖拽 ===== */
            else if (ev.touches.length === 1 && scaleRef.current > 1) {
                const x = ev.touches[0].clientX;
                const y = ev.touches[0].clientY;

                const dx = (x - startRef.current.x) * moveSpeed;
                const dy = (y - startRef.current.y) * moveSpeed;

                const { maxX, maxY } = getBounds(scaleRef.current);

                translateRef.current.x = clamp(
                    translateRef.current.x + dx,
                    -maxX,
                    maxX
                );
                translateRef.current.y = clamp(
                    translateRef.current.y + dy,
                    -maxY,
                    maxY
                );

                startRef.current = { x, y };
            }

            applyTransform();
            rafRef.current = null;
        });
    };

    /* ---------- 初始化 ---------- */
    useEffect(() => {
        applyTransform();
    }, []);

    return {
        containerRef,
        onTouchStart,
        onTouchMove,
        scaleRef,        // 如有需要外部读取
        translateRef
    };
}

export default usePinchZoomPan;

