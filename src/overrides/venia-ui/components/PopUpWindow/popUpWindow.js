import React, { useState, useEffect } from 'react';
import './popUpwindow.css';
import { createPortal } from 'react-dom';
const PopUpWindow = ({ isOpen, onClose, children, contentClassName = '' }) => {

  const [isModalVisible, setIsModalVisible] = useState(isOpen);
  const [showBack, setShowBack] = useState(false);
  const [childOnBack, setChildOnBack] = useState(null);

  useEffect(() => {
    setIsModalVisible(isOpen);
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  const handleBackClick = () => {
    if (childOnBack) {
      childOnBack();
    } else {
      onClose();
    }
  };

  if (!isModalVisible) return null;

  const closeButtonAction =
    contentClassName.includes('checkout-voucher-modal') && showBack && window.innerWidth <= 767
      ? handleBackClick
      : onClose;

  const popConetn = (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content ${contentClassName}`}>
        {showBack && (<button className="modal-back-btn" onClick={handleBackClick}>&lt;</button>)}
        <button className="modal-close-btn" onClick={closeButtonAction}> ×</button>
        {React.cloneElement(children, { setShowBack, setChildOnBack })}
      </div>
    </div>
  );
   return createPortal(popConetn, document.body);
};

export default PopUpWindow;
