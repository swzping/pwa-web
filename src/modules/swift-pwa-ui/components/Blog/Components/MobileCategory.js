import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './mobileCategory.module.css';
import { Link } from 'react-router-dom';
import { X as CloseIcon } from 'react-feather';

const MobileCategory = ({sideMenu, closeMenu, categoryData}) => {
    const classes = useStyle(defaultClasses);
    const rootClasses = !sideMenu ? classes.root : classes.root_open
    const contentsClass = !sideMenu ? classes.contents_open : classes.contents
    return (
        <div className={rootClasses}>
            <div className={contentsClass}>
                <div className={classes.header}>
                    <button
                        onClick={closeMenu}
                    >
                        <CloseIcon />
                    </button>
                    Blog
                </div>
                <ul className={classes.TextContent}>
                    {categoryData.map((item, index) => (
                        <li className={classes.categoryList} key={index}>
                            <Link onClick={closeMenu} className={classes.categoryLink} to={`/blog/category/${item.id}`}>
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default MobileCategory
