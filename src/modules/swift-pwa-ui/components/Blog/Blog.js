import React from 'react';
import { mergeClasses } from '@magento/venia-ui/lib/classify';
import BlogItem from './BlogItem';
import defaultClasses from './blog.module.css';

const Blog = props => {
    const { blogData, categoryData } = props;
    const classes = mergeClasses(defaultClasses, props.classes);

    const { getBlogByFilter } = blogData;

    if (!getBlogByFilter.items || !getBlogByFilter.total_count)
        return <div>{'There are no posts at this moment'}</div>;

    return (
        <div className={classes.blogListingCtn}>
            {getBlogByFilter.items.map(item => (
                <BlogItem categoryData={categoryData} classes={classes} item={item} key={item.post_id} />
            ))}
        </div>
    );
};

export default Blog;
