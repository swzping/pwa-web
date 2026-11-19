import React, { useState } from 'react';
import { func, number, shape, string } from 'prop-types';
import { useCategoryTree } from '@magento/peregrine/lib/talons/CategoryTree';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Branch from './categoryBranch';
import Leaf from './categoryLeaf';
import defaultClasses from './categoryTree.module.css';
import { useVesMenu } from '../../../../modules/peregrine/talons/VesMenu/useVesMenu';
import VesMenuMobileBranch from '../../../../modules/swift-pwa-ui/components/VesMenu/vesMenuMobileBranch';


const Tree = props => {
    const {
        categoryId,
        onNavigate,
        setCategoryId,
        updateCategories,
        openChildren,
        setOpenChildren
    } = props;

    // data ves menu
    const { vesMenuData, activeCategoryId } = useVesMenu();
    const [dataChildren, setDataChildren] = useState(null);

    const talonProps = useCategoryTree({
        categoryId,
        updateCategories
    });

    const { data, childCategories, categoryUrlSuffix } = talonProps;
    const classes = useStyle(defaultClasses, props.classes);

    // for each child category, render a direct link if it has no children
    // otherwise render a branch
    const branches = data
        ? Array.from(childCategories, childCategory => {
              const [id, { category, isLeaf }] = childCategory;
              return isLeaf ? (
                  <Leaf
                      key={id}
                      category={category}
                      onNavigate={onNavigate}
                      categoryUrlSuffix={categoryUrlSuffix}
                  />
              ) : (
                  <Branch
                      key={id}
                      category={category}
                      setCategoryId={setCategoryId}
                  />
              );
          })
        : null;

    // VesMenu
    const vesMenuBranches = vesMenuData && vesMenuData.children && vesMenuData.children.length
        ? vesMenuData.children.map(menu => {
            if (menu.children.length) {
                const childrenData = menu.children;
                return (
                    <VesMenuMobileBranch
                        key={menu.id}
                        setOpenChildren={setOpenChildren}
                        setDataChildren={setDataChildren}
                        category={menu}
                        childrenData={childrenData}
                    />
                );
            } else {
                return (
                    <Leaf
                        key={menu.id}
                        category={menu}
                        onNavigate={onNavigate}
                    />
                );
            }
        })
    : null;

    // VesMenu Children
    const vesMenuChildren = dataChildren && dataChildren.map(menu => {
        return (
            <Leaf
                key={menu.id}
                category={menu}
                onNavigate={onNavigate}
            />
        );
    });

    return (
        <div className={classes.root}>
            <ul className={classes.tree}>
                {
                    !!process.env.VESMENU_ENABLE ? (
                        !openChildren ? vesMenuBranches : vesMenuChildren
                    ) : (
                        branches
                    )
                }
            </ul>
        </div>
    );
};

export default Tree;

Tree.propTypes = {
    categoryId: number,
    classes: shape({
        root: string,
        tree: string
    }),
    onNavigate: func.isRequired,
    setCategoryId: func.isRequired,
    updateCategories: func.isRequired
};
