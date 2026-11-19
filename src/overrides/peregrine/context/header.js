import React, { createContext, useState, useCallback } from 'react';

export const HeaderContext = createContext();

const HeaderContextProvider = props => {
    const [mobileNavConfig, setMobileNavConfig] = useState({
        showMobileNav: true,
        headerTitle: '',
        redirectHome: false,
        closeIcon: false,
        useCart: true,
        borderBottom: false
    });

    const setNavConfig = useCallback(objectData => {
        setMobileNavConfig(prevConfig => ({ ...prevConfig, ...objectData }));
    }, []);

    const value = {
        mobileNavConfig,
        setNavConfig
    };

    return (
        <HeaderContext.Provider value={value}>
            {props.children}
        </HeaderContext.Provider>
    );
};

export default HeaderContextProvider;
