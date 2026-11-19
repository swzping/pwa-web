import React from 'react'
import { useStyle } from '@magento/venia-ui/lib/classify';
import Icon from '@magento/venia-ui/lib/components/Icon';

import defaultClasses from './layoutSwitcher.module.css';

const DEFAULT_ICON_SIZE = 20;

const layoutSwitcher = (props) => {
    const { options, layoutSwitcherProps } = props;
    const classes = useStyle(defaultClasses);
    const [currentSwitcher, setCurrentSwitcher] = layoutSwitcherProps;

    const handleSelectSwitcher = (value) => setCurrentSwitcher(value);

    return (
        <div className={classes.root}>
            {options.map((option) => {
                let rootSwitcherClasses = [classes.btn_switcher];

                if (option.value === currentSwitcher) {
                    rootSwitcherClasses.push(classes.btn_switcher_selected);
                }

                return (
                    <div 
                        key={option.value} 
                        className={rootSwitcherClasses.join(' ')}
                        onClickCapture={() => handleSelectSwitcher(option.value)}
                    >
                        <Icon 
                            classes={{ icon: classes.icon }} 
                            size={option.size || DEFAULT_ICON_SIZE} 
                            src={option.icon} 
                        />
                    </div>
                );
            })}
        </div>
    )
}

export default layoutSwitcher;
