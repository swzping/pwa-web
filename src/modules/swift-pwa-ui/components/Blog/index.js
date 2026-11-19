import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
// import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
// import { Menu as Humberger} from 'react-feather';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { useBlog } from '../../../peregrine/talons/Blog/useBlog';
import Blog from './Blog';
import classes from './blog.module.css';
// import MobileCategory from './Components/MobileCategory';
import SideNavBlog from './Components/SideNavBlog';
import Pagination from '@magento/venia-ui/lib/components/Pagination';

const Main = () => {
    // const [sideMenu, setSideMenu] = useState(false);
    const {
        blogData,
        blogLoading,
        blogError,
        categoryData,
        categoryLoading,
        pageControl
    } = useBlog();
    const history = useHistory();

    useEffect(() => {
        if (blogLoading) {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }
    }, [blogLoading]);

    const handleGoHome = useCallback(() => {
        history.push('/');
    }, [history]);

    // if (blogLoading || categoryLoading) return <LoadingIndicator />;
    if (blogLoading || categoryLoading) {
        return (
            <div className={classes.mainCtn}>
                <div className={classes.blogRoot}>
                    <div className={classes.blogListing}>
                        <div style={{ paddingTop: '25px' }}>
                            <div className="mb-2">
                                <Shimmer height="20px" width="200px" />
                            </div>
                            <div className="mb-2">
                                <Shimmer height="16px" width="250px" />
                            </div>
                            <Shimmer height="500px" width="100%" />
                        </div>
                    </div>
                    <div className={classes.blogSidebar}>
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
                </div>
            </div>
        );
    };

    if (blogError || !blogData || !blogData.getBlogByFilter.items) return '';

    // const openMenu = () => {
    //     setSideMenu(true);
    // };

    // const closeMenu = () => {
    //     setSideMenu(false);
    // };

    return (
        <div className={classes.mainCtn}>
            <div className={classes.blogBreadCrumb}>
                <button className={classes.breadCrumbLink} onClick={handleGoHome}>Home</button>
                <span className={classes.breadCrumbSeparator}>/</span>
                <span className={classes.breadCrumbText}>Blog</span>
            </div>
            <h1 className={classes.blogMainTitle}>Blog</h1>
            {/* <div className={classes.categoryHumberger}>
                <button
                    onClick={openMenu}
                >
                    <Humberger />
                    {' '}
                    Categories
                </button>
                <MobileCategory 
                    sideMenu={sideMenu}
                    closeMenu={closeMenu}
                    categoryData={categoryData.getBlogCategory.data}
                />
            </div> */}
            <div className={classes.blogRoot}>
                <div className={classes.blogListing}>
                    <Blog categoryData={categoryData.getBlogCategory.data} blogData={blogData} classes={classes} />
                    <div>
                        <Pagination pageControl={pageControl} />
                    </div>
                </div>
                <div className={classes.blogSidebar}>
                    <SideNavBlog />
                </div>
            </div>
        </div>
    );
};

export default Main;
