import React, { useState, useContext, useEffect, useMemo } from 'react';
import { shape, string } from 'prop-types';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import SearchBar from '@magento/venia-ui/lib/components/SearchBar';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import defaultClasses from './categoryPage.module.css';
import { Campaign, BabyOutline, FaceAgentOutline, BodyCareOutline, CosmeticOutline, FaceTreatmentOutline, OralCareOutline, ChevronDownOutline, ChevronRightOutlined } from '../../../../assets/icons';
import { useVesMenu } from '../../../peregrine/talons/VesMenu/useVesMenu';
// TODO: 待确认是否从后端返回自定义样式
function extractTextUsingDOMParser(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.textContent || "";
}

const CategoryPage = props => {
    const { classes: propClasses } = props;
    const classes = useStyle(defaultClasses, propClasses);
    const { vesMenuData } = useVesMenu();
    const { formatMessage } = useIntl();
    const { setNavConfig } = useContext(HeaderContext);
    const [activeMenu, setActiveMenu] = useState(null);
    const [expandedSubMenu, setExpandedSubMenu] = useState(null);

    const Icons = [BabyOutline, FaceAgentOutline, BodyCareOutline, CosmeticOutline, FaceTreatmentOutline, OralCareOutline]

    const allText = formatMessage({ id: 'global.all', defaultMessage: 'All' })

    const handleMenuClick = (menuId) => {
        setActiveMenu(menuId === activeMenu ? null : menuId);
        setExpandedSubMenu(null);
    };

    const handleSubMenuClick = (subMenuId, e) => {
        e.stopPropagation();
        setExpandedSubMenu(subMenuId === expandedSubMenu ? null : subMenuId);
    };

    const preventDefaultIfSubmenu = (e, hasChildren) => {
        if (hasChildren) {
            e.preventDefault();
        }
    };

    const level1Menu = useMemo(() => {
        return vesMenuData.children.find(category => category.id === activeMenu)
    }, [vesMenuData, activeMenu])

    useEffect(() => {
        setNavConfig({
            showMobileNav: false
        });
    }, []);

    return (
        <div className={classes.root}>
            <div className={classes.searchBar}>
                <SearchBar isOpen={false} />
            </div>
            <div className={classes.categoryContent}>
                <div className={classes.level1Column}>
                    <ul className={classes.level1Menu}>
                        {vesMenuData.children.map((category, index) => (
                            <li
                                key={category.id}
                                className={`${classes.level1Item} ${activeMenu === category.id ? classes.active : ''}`}
                                onClick={() => handleMenuClick(category.id)}
                            >
                                <a
                                    href={`/${category.url_path}`}
                                    onClick={(e) => preventDefaultIfSubmenu(e, category.children && category.children.length > 0)}
                                    className={classes.level1Link}
                                >
                                    {(Icons[index] && React.createElement(Icons[index])) || BabyOutline}
                                    <div dangerouslySetInnerHTML={{ __html: extractTextUsingDOMParser(category.name) }} />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={classes.level2Column}>
                    {activeMenu && (
                        <ul className={classes.level2Menu}>
                            {
                                level1Menu?.children?.length > 0 ?
                                    <li className={classes.level2Item}>
                                        <div className={classes.levelLinkWrapper}>
                                            <Link
                                                className={classes.level2Link}
                                                to={`/${level1Menu?.url_path}`}>
                                                <div dangerouslySetInnerHTML={{ __html: extractTextUsingDOMParser(`${allText} ${level1Menu?.name}`) }} />
                                            </Link>
                                            <ChevronRightOutlined className={classes.chevronIcon} />
                                        </div>
                                    </li> : null
                            }
                            {vesMenuData.children.find(category => category.id === activeMenu).children.map(subCategory => (
                                <li key={subCategory.id} className={classes.level2Item}>
                                    <div
                                        className={classes.level2LinkWrapper}
                                    >
                                        <Link
                                            className={classes.level2Link}
                                            to={`/${subCategory.url_path}`}
                                            onClick={(e) => preventDefaultIfSubmenu(e, subCategory.children && subCategory.children.length > 0)}
                                        >
                                            {subCategory.name}
                                        </Link>
                                        {subCategory.children && subCategory.children.length > 0 && (
                                            <ChevronDownOutline
                                                onClick={(e) => handleSubMenuClick(subCategory.id, e)}
                                                className={`${classes.chevronIcon} ${expandedSubMenu === subCategory.id ? classes.expanded : ''}`}
                                            />
                                        )}
                                    </div>
                                    {subCategory.children && expandedSubMenu === subCategory.id && (
                                        <ul className={classes.level3Menu} style={{ display: 'block' }}>
                                            <li className={classes.level3Item}>
                                                <Link
                                                    className={classes.level3Link}
                                                    to={`/${subCategory.url_path}`}
                                                >
                                                    {`${allText} ${subCategory.name}`}
                                                </Link>
                                            </li>
                                            {subCategory.children.map(childCategory => (
                                                <li key={childCategory.id} className={classes.level3Item}>
                                                    <Link to={`/${childCategory.url_path}`} className={classes.level3Link}>
                                                        {childCategory.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

CategoryPage.propTypes = {
    classes: shape({
        root: string,
        level1Column: string,
        level1Menu: string,
        level1Item: string,
        level1Link: string,
        level2Column: string,
        level2Menu: string,
        level2Item: string,
        level2Link: string,
        level2LinkWrapper: string,
        level3Menu: string,
        level3Item: string,
        level3Link: string,
        active: string,
        chevronIcon: string,
        expanded: string,
    }),
};

export default CategoryPage;
