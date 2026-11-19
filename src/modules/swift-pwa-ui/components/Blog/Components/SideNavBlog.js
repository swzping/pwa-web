import React from 'react';
import { Link } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './sideNavBlog.module.css';
import { useSideNavBlog } from '../../../../peregrine/talons/Blog/useSideNavBlog';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';

const SideNavBlog = () => {
    const classes = useStyle(defaultClasses);
    const talonProps = useSideNavBlog();
    const {
        categoryData,
        categoryLoading,
        recentData,
        recentLoading
    } = talonProps;

    if (categoryLoading || recentLoading) {
        return (
            <div>
                <div className="mb-2">
                    <Shimmer height="20px" width="220px" />
                </div>
                <div className="mb-2">
                    <Shimmer height="16px" width="180px" />
                </div>
                <div className="mb-2">
                    <Shimmer height="16px" width="180px" />
                </div>
                <div className="mb-2">
                    <Shimmer height="16px" width="180px" />
                </div>
                <div className="mb-2">
                    <Shimmer height="16px" width="180px" />
                </div>
            </div>
        );
    }

    const categoryDataComponent = categoryData.getBlogCategory.data.length > 0 ? (
        <ul className={classes.categoryWrapper}>
            {categoryData.getBlogCategory.data.map((item, index) => (
                <li className={classes.categoryLinkWrapper} key={index}>
                    <Link to={`/blog/category/${item.url_key}`}>
                        {item.name}
                    </Link>
                </li>
            ))}
        </ul>
    ) : null;

    const recentPost = recentData.getBlogList.items.length > 0 ? (
        <ul className={classes.categoryWrapper}>
            {
                recentData.getBlogList.items.map((item, idx) => (
                    <li className={classes.recentLinkWrapper} key={idx}>
                        <Link
                            to={`/blog/post/${item.url_key}`}
                        >
                            {item.title}
                        </Link>
                    </li>
                ))
            }
        </ul>
    ) : null;

    return (
        <>
            <h2 className={classes.sideNavTitle}>Categories</h2>
            {categoryDataComponent}

            <h2 className={classes.recentTitle}>Recent post</h2>
            {recentPost}
        </>
    );
};

export default SideNavBlog;
