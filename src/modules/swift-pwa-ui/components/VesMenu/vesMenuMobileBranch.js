import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './vesMenuMobileBranch.module.css';

const VesMenuMobileBranch = (props) => {
    const {
        childrenData,
        category,
        setDataChildren,
        setOpenChildren
    } = props;

    const classes = useStyle(defaultClasses, props.classes);

    const openChild = () => {
        setDataChildren(childrenData);
        setOpenChildren(true);
    };

    return (
        <li className={classes.root}>
            <button
                className={classes.target}
                type="button"
                onClick={openChild}
            >
                <span className={classes.text}>
                    <div dangerouslySetInnerHTML={{__html: category.name}}></div>
                </span>
            </button>
        </li>
    )
}

export default VesMenuMobileBranch
