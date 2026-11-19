import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '@magento/venia-ui/lib/components/MegaMenu/megaMenuItem.module.css';
import Submenu from '@magento/venia-ui/lib/components/MegaMenu/submenu';
import { trackNavigationCommonClick } from '@/utils/track';
import compClasses from './vesMenuItem.module.css';

function extractTextUsingDOMParser(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.textContent || "";
}

/**
 * The VesMenuItem component displays mega menu item
 *
 * @param {VesMenuCategory} props.category
 * @param {int} props.activeCategoryId - id of active category
 * @param {int} props.mainNavWidth - width of the main nav. It's used for setting min-width of the submenu
 */
const VesMenuItem = props => {
    const { activeCategoryId, category, mainNavWidth, itemIndex } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const [isSubmenuVisible, setIsSubmenuVisible] = useState(false);

    const categoryUrl = resourceUrl(`/${category.url_path}${category.url_suffix || ''}`);
    const vesMenuItemImage = category && category.dropdown_bgimage ? category.dropdown_bgimage : null;

    // 只在itemIndex===0时插入8列布局CSS
    useEffect(() => {
        if(itemIndex === 0){
            const style = document.createElement('style');
            style.innerHTML = `
                .eight-col-menu div > .row > div:first-child {
                    width: 100% !important;
                    max-width: 100% !important;
                    flex: 0 0 100% !important;
                }
                .eight-col-menu div > .row > div:nth-child(2) {
                    width: 0 !important;
                    max-width: 0 !important;
                    min-width: 0 !important;
                    flex: 0 0 0 !important;
                    display: none !important;
                }
                .eight-col-menu div > .row > div:first-child > .row {
                    display: grid !important;
                    grid-template-columns: repeat(8, 1fr) !important;
                    gap: 0 16px;
                }
                .eight-col-menu div > .row > div:first-child > .row > div {
                    min-width: 100% !important;
                    max-width: 100% !important;
                }
            `;
            document.head.appendChild(style);
            return () => style.remove();
        }
    }, [itemIndex]);

    const handleChildLinkClick = (secondItem = {}, thirdItem = {}, type = '') => {
        // 触发回调函数
        setIsSubmenuVisible(false);
        trackNavigationCommonClick(
            { first_level_module: category.name, first_level_module_rank: itemIndex + 1 },
            secondItem,
            thirdItem,
            type
        );
    };

    const children = category.children.length ? (
        <Submenu
            vesMenuItemImage={vesMenuItemImage}
            items={category.children}
            subMenuClassname="subMenu-Ves"
            mainNavWidth={mainNavWidth}
            onSubmenuItemClick={(item, childItem, type) =>
                handleChildLinkClick(item, childItem, type)
            } // 传递关闭函数
        />
    ) : null;

    const handleLinkClick = () => {
        trackNavigationCommonClick(
            { first_level_module: category.name, first_level_module_rank: itemIndex + 1 },
            {},
            {},
            'firstLevel'
        );
        setIsSubmenuVisible(false); // 点击链接后隐藏 submenu
    };

    return (
        <div
            className={`${compClasses.root} ${classes.megaMenuItem} ${category.isActive && classes.megaMenuLinkActive} ${itemIndex === 0 ? 'eight-col-menu' : ''}`}
            onMouseEnter={() => setIsSubmenuVisible(true)}
            onMouseLeave={() => setIsSubmenuVisible(false)}
        >
            <Link
                className={`${compClasses.link_container} ${classes.megaMenuLink}`}
                to={categoryUrl}
                dangerouslySetInnerHTML={{ __html: extractTextUsingDOMParser(category.name)}}
                onClick={handleLinkClick} // 点击时触发关闭 submenu
            />
            {isSubmenuVisible && children}
        </div>
    );
};

export default VesMenuItem;

VesMenuItem.propTypes = {
    category: PropTypes.shape({
        children: PropTypes.array,
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        url_path: PropTypes.string.isRequired,
        url_suffix: PropTypes.string
    }).isRequired,
    activeCategoryId: PropTypes.number,
    mainNavWidth: PropTypes.number.isRequired
};
