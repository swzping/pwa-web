import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { CloseOutline } from '../../../../assets/icons';
import styles from './popup.module.css';

const Popup = ({
  isOpen,
  onClose,
  onOpen,
  children,
  overlay = true,
  closeOnClickOverlay = true,
  position = 'center',
  duration = 0.3,
  zIndex = 2000,
  lockScroll = true,
  lazyRender = true,
  closeable = false,
  safeAreaInsetTop = false,
  safeAreaInsetBottom = false,
  style = {},
  title = ''
}) => {
  const popupRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (lockScroll) document.body.style.overflow = 'hidden';
      if (onOpen) onOpen();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, lockScroll, onOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target) && !overlay) {
        onClose();
      }
    };

    if (isOpen && !overlay) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, overlay, onClose]);

  if (!isOpen && lazyRender) {
    return null;
  }

  const positionClass = styles[`popup${position.charAt(0).toUpperCase() + position.slice(1)}`];
  const safeAreaClass = `${safeAreaInsetTop ? styles.safeAreaInsetTop : ''} ${safeAreaInsetBottom ? styles.safeAreaInsetBottom : ''}`;

  return ReactDOM.createPortal(
    <>
      {isOpen && (
        <>
          {overlay && (
            <div
              className={styles.popupOverlay}
              style={{ zIndex }}
              onClick={(e) => { e.stopPropagation(); closeOnClickOverlay && onClose(); }}
            />
          )}
          <div
            ref={popupRef}
            className={`${styles.popupContent} ${positionClass} ${safeAreaClass}`}
            style={{ ...style, transitionDuration: `${duration}s`, zIndex: zIndex + 1, position: 'fixed' }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && <div className={styles.popupTitle}>{title}</div>}
            {children}
            {closeable && (
              <button className={styles.popupClose} onClick={onClose}>
                <CloseOutline />
              </button>
            )}
          </div>
        </>
      )}
    </>,
    document.body
  );
};

Popup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpen: PropTypes.func,
  children: PropTypes.node.isRequired,
  overlay: PropTypes.bool,
  closeOnClickOverlay: PropTypes.bool,
  position: PropTypes.oneOf(['top', 'bottom', 'right', 'left', 'center']),
  duration: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  zIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lockScroll: PropTypes.bool,
  lazyRender: PropTypes.bool,
  closeable: PropTypes.bool,
  safeAreaInsetTop: PropTypes.bool,
  safeAreaInsetBottom: PropTypes.bool,
  style: PropTypes.object,
  title: PropTypes.string
};

export default Popup;
