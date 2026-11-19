import React, { useState } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '@magento/venia-ui/lib/components/MegaMenu/submenu.module.css';
import SubmenuColumn from '@magento/venia-ui/lib/components/MegaMenu/submenuColumn';
import PropTypes from 'prop-types';
import Image from '@magento/venia-ui/lib/components/Image';
import { Link } from 'react-router-dom';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';

/**
 * The Submenu component displays submenu in mega menu
 *
 * @param {array} props.items - categories to display
 * @param {int} props.mainNavWidth - width of the main nav. It's used for setting min-width of the submenu
 */
const Submenu = props => {
    const { items, mainNavWidth, vesMenuItemImage, onSubmenuItemClick } = props; // 接收回调函数
    const PADDING_OFFSET = 20;
    const classes = useStyle(defaultClasses, props.classes);
    const [activeItem, setActiveItem] = useState(null);

    const isActiveItemClass = item =>
        item.id == activeItem?.id ? 'active' : '';

    const subMenus =
        activeItem &&
        activeItem.children &&
        activeItem.children.map(category => (
            <SubmenuColumn
                key={category.id}
                category={{
                    ...category,
                    children: category.children || {}
                }}
            />
        ));

    const greyImage =
        'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
    return (
        <div className={classes.submenu}>
            <div className={classes.submenuItems}>
                <div className="row">
                    <div className="col col-md-9 level-2">
                        <div className="row" style={{ padding: '0 14px 20px' }}>
                            {items.map((item, i) => (
                                <div className={`${classes.submenuItem} col-3 col-md-4`} key={i}>
                                    <div>
                                        <Link
                                            className={isActiveItemClass(item)}
                                            key={i}
                                            to={resourceUrl(
                                                `/${
                                                    item.url_path
                                                }${item.url_suffix || ''}`
                                            )}
                                            onMouseEnter={() =>
                                                setActiveItem(item)
                                            }
                                            onClick={() =>
                                                onSubmenuItemClick({...item, sort_by: i+1}, {}, 'secondLevel')
                                            }
                                        >
                                            <h3>{item.name}</h3>
                                        </Link>
                                    </div>
                                    {item.children.map((val, key) => (
                                        <Link
                                            className={classes.subItem}
                                            key={key}
                                            to={resourceUrl(
                                                `/${
                                                    val.url_path
                                                }${val.url_suffix || ''}`
                                            )}
                                            onClick={() =>
                                                onSubmenuItemClick({...item, sort_by: i+1}, {...val, sort_by: key+1}, 'thirdLevel')
                                            }
                                        >
                                            {val.name}
                                        </Link>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* <div className="col col-md-7 level-3">
                        {subMenus}
                    </div> */}
                    <div className={`${classes.imageWrapper} col col-md-3`}>
                        <Image
                            alt="Category Image"
                            height={'100%'}
                            src={vesMenuItemImage ? vesMenuItemImage : greyImage}
                            title="Category Image"
                            width={'100%'}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Submenu;

Submenu.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            children: PropTypes.array.isRequired,
            id: PropTypes.number.isRequired,
            include_in_menu: PropTypes.number.isRequired,
            isActive: PropTypes.bool.isRequired,
            name: PropTypes.string.isRequired,
            path: PropTypes.array.isRequired,
            position: PropTypes.number.isRequired,
            url_path: PropTypes.string.isRequired,
            url_suffix: PropTypes.string
        })
    ).isRequired,
    mainNavWidth: PropTypes.number.isRequired,
    onSubmenuItemClick: PropTypes.func // PropTypes 验证
};
