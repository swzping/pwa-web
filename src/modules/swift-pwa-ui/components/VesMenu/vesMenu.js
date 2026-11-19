import React, { useRef, useState, useEffect } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '@magento/venia-ui/lib/components/MegaMenu/megaMenu.module.css';

import { useVesMenu } from '../../../peregrine/talons/VesMenu/useVesMenu';

import VesMenuItem from './vesMenuItem';

/**
 * The MegaMenu component displays menu with categories on desktop devices
 */
const VesMenu = props => {
    const { vesMenuData, activeCategoryId } = useVesMenu();
    const classes = useStyle(defaultClasses, props.classes);

    const mainNavRef = useRef(null);
    const [mainNavWidth, setMainNavWidth] = useState(0);
    
    useEffect(() => {
        const handleResize = () => {
            const navWidth = mainNavRef.current
                ? mainNavRef.current.offsetWidth
                : null;

            setMainNavWidth(navWidth);
        };
        
        window.addEventListener('resize', handleResize);

        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });

    const items = vesMenuData.children
        ? vesMenuData.children.map((category,index) => {
              return (
                  <VesMenuItem
                      itemIndex={index}
                      category={category}
                      activeCategoryId={activeCategoryId}
                      mainNavWidth={mainNavWidth}
                      key={category.id}
                  />
              );
          })
        : null;

    return (
        <nav ref={mainNavRef} className={classes.megaMenu} role="navigation">
            {items}
        </nav>
    );
};

export default VesMenu;
