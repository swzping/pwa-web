import React from 'react';
import RichContent from '@magento/venia-ui/lib/components/RichContent';
import { useParams } from 'react-router-dom';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { usePost } from '../../../../peregrine/talons/Blog/usePost';
import classes from './post.module.css';
import {
    TwitterShareButton,
    FacebookShareButton,
    EmailShareButton,
    LinkedinShareButton,
    PinterestShareButton
} from 'react-share';
import SideNavBlog from '../Components/SideNavBlog';
import { Link } from 'react-router-dom';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';

const Post = () => {
    const { postUrl = '' } = useParams();
    const { 
        postData, 
        postLoading,
        categoryData,
        categoryLoading
    } = usePost({ postUrl });
    const location = window.location.href;

    if (!postUrl) return '';
    if (postLoading || categoryLoading) {
        return (
            <div className={classes.root}>
                <div className={classes.wrapperDivider}>
                    <div className={classes.sideNavWrapper}>
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
                    <div className={classes.detailWrapper}>
                        <div className="mb-2">
                            <Shimmer height="20px" width="200px" />
                        </div>
                        <div className="mb-2">
                            <Shimmer height="16px" width="250px" />
                        </div>
                        <div className="mb-2">
                            <Shimmer height="300px" width="100%" />
                        </div>
                        <div className="mb-2">
                            <Shimmer height="200px" width="100%" />
                        </div>
                    </div>
                </div>
            </div>
        )
    };

    if (
        !postData ||
        !postData.getBlogByFilter ||
        !postData.getBlogByFilter.items ||
        !postData.getBlogByFilter.items[0]
    )
        return <ErrorView message="Blog Not Found" />;

    const post = postData.getBlogByFilter.items[0];

    const filterCategory = () => {
        let filteredResult = [];
        for( let index = 0; index < categoryData.getBlogCategory.data.length; index++ ) {
            for ( let j = 0; j <  post.category_ids.length; j++){
                if (categoryData.getBlogCategory.data[index].id === post.category_ids[j]) {
                    filteredResult.push(categoryData.getBlogCategory.data[index])
                }
            }
        }
        return filteredResult;
    }
    
    const PostedComponent = () => {
        const filtered = filterCategory();

        if (filtered.length > 0) {
            return (
                <>
                    {
                        filtered.map(item => (
                            <Link
                                className={classes.filteredCategory}
                                key={item.id}
                                to={`/blog/category/${item.url_key}`}
                            >
                                {item.name}
                            </Link>
                        ))
                    }
                </>
            );
        } else {    
            return (
                <>
                    {'-'}
                </>
            );
        }

    }

    const tagNames = post.tag_names.length > 0 ? (
        <>
            {
                post.tag_names.map((tag, idx) => (
                    <span className={classes.tagDetail} key={idx}>
                        {tag}
                        {','}
                    </span>
                ))
            }
        </>
    ) : null;


    const formatDate = (date) => {
        const isoFormattedDate = date.replace(' ', 'T');
        const formattedDate = new Date(isoFormattedDate).toLocaleDateString(
            'id-ID',
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }
        );
        return formattedDate;
    };

    return (
        <div className={classes.root}>
            <div className={classes.blogBreadCrumb}>
                <Link className={classes.breadCrumbLink} to="/">Home</Link>
                <span className={classes.breadCrumbSeparator}>/</span>
                <Link className={classes.breadCrumbLink} to="/blog">Blog</Link>
                <span className={classes.breadCrumbSeparator}>/</span>
                <span className={classes.breadCrumbText}>{post.title}</span>
            </div>
            <div className={classes.wrapperDivider}>
                <div className={classes.sideNavWrapper}>
                    <SideNavBlog />
                </div>
                <div className={classes.detailWrapper}>
                    <div>
                        <h2 className={classes.detailMainTitle}>{post.title}</h2>
                        <p className={classes.dateTitle}>{formatDate(post.publish_date)}</p>
                    </div>
                    <style
                        dangerouslySetInnerHTML={{
                            __html: `
                            .${classes.blogPostRichContent}
                    `
                        }}
                    />
                    <div className={classes.blogDetailsRoot}>
                        <div className={classes.blogDetailsContent}>
                            {!!post.featured_image_url && (
                                <img
                                    src={post.featured_image_url}
                                    alt="post image"
                                    className={classes.blogpostImage}
                                />
                            )}
                            <RichContent
                                classes={{ root: classes.blogPostRichContent }}
                                html={post.content}
                            />
                        </div>
                    </div>
                    <div className={classes.socialWrapper}>
                        <p>share</p>
                        <div>
                            <TwitterShareButton url={location}>
                                <i className={`${classes.socialIcon} icon-blog_twitter`}></i>
                            </TwitterShareButton>
                            <LinkedinShareButton url={location}>
                                <i className={`${classes.socialIcon} icon-blog_linkedin`}></i>
                            </LinkedinShareButton>
                            <FacebookShareButton url={location}>
                                <i className={`${classes.socialIcon} icon-blog_facebook`}></i>
                            </FacebookShareButton>
                            <EmailShareButton url={location}>
                                <i className={`${classes.socialIcon} icon-blog_google`}></i>
                            </EmailShareButton>
                            <PinterestShareButton media={location} url={location}>
                                <i className={`${classes.socialIcon} icon-blog_pinterest`}></i>
                            </PinterestShareButton>
                        </div>
                    </div>
                    <div className={`${classes.tagWrapper} d-flex align-items-center justify-content-between`}>
                        <div className="d-flex align-items-center">
                            <p className={classes.titleTag}>Posted in</p>
                            <PostedComponent />
                        </div>
                        <div className="d-flex align-items-center">
                            <p className={classes.titleTag}>Tags</p>
                            {tagNames}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Post;
