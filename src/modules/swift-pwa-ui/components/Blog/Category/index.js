import React from 'react';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import { mergeClasses } from '@magento/venia-ui/lib/classify';
import { useParams } from 'react-router-dom';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { useCategory } from '../../../../peregrine/talons/Blog/useCategory';
import BlogItem from '../BlogItem';
import defaultClasses from './category.module.css';
import blogClasses from '../blog.module.css';
import SideNavBlog from '../Components/SideNavBlog';
import { Link } from 'react-router-dom';
import Pagination from '@magento/venia-ui/lib/components/Pagination';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';

const Category = props => {
    const { categoryUrl = '' } = useParams();

    const { 
        blogData, 
        blogLoading,
        categoryData,
        pageControl,
        categoryLoading,
        allCategoryData,
        allCategoryLoading 
    } = useCategory({
        categoryUrl: categoryUrl
    });
    const classes = mergeClasses(defaultClasses, blogClasses);
    
    // if (blogLoading) return <LoadingIndicator />;
    if (blogLoading || categoryLoading || allCategoryLoading) {
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
        )
    };

    if (
        !categoryData ||
        !categoryData.getBlogCategory ||
        !categoryData.getBlogCategory.data.length ||
        !categoryData.getBlogCategory.data[0]
    )
        return <ErrorView />;

    const { getBlogByFilter } = blogData;

    return (
        <div className={classes.root}>
            <div className={classes.blogBreadCrumb}>
                <Link className={classes.breadCrumbLink} to="/">Home</Link>
                <span className={classes.breadCrumbSeparator}>/</span>
                <Link className={classes.breadCrumbLink} to="/blog">Blog</Link>
                <span className={classes.breadCrumbSeparator}>/</span>
                <span className={classes.breadCrumbText}>{categoryUrl}</span>
            </div>
            <h1 className={classes.blogMainTitle}>
                {
                    categoryData ? categoryData.getBlogCategory.data[0].name : ''
                }
            </h1>
            <div className={classes.wrapperDivider}>
                <div className={classes.sideNavWrapper}>
                    <SideNavBlog />
                </div>
                <div className={classes.detailWrapper}>
                    {
                        !getBlogByFilter || !getBlogByFilter.total_count || !categoryData ? (
                            <div>{'There are no posts at this moment'}</div>
                        ) : (
                            <>
                                {getBlogByFilter.items.map((item, idx) => (
                                    <BlogItem categoryData={allCategoryData.getBlogCategory.data} key={idx} classes={classes} item={item} key={item.post_id} />
                                ))}

                                <div>
                                    <Pagination pageControl={pageControl} />
                                </div>
                            </>
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default Category;
