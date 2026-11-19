import React from 'react';
import { Link } from 'react-router-dom';
import RichText from '@magento/venia-ui/lib/components/RichText';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './blogItem.module.css';

const BlogItem = props => {
    const { item, categoryData } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const { title, featured_image_url, short_content, url_key, publish_date, blog_post_url } = item;
    
    const filterCategory = () => {
        let filteredResult = [];
        for( let index = 0; index < categoryData.length; index++ ) {
            for ( let j = 0; j <  item.category_ids.length; j++){
                if (categoryData[index].id === item.category_ids[j]) {
                    filteredResult.push(categoryData[index])
                }
            }
        }
        return filteredResult;
    }
    
    const PostedComponent = () => {
        const filtered = filterCategory();

        if (filtered.length > 0) {
            return (
                <p className={classes.categoryText}>
                    Posted in
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
                </p>
            );
        } else {    
            return (
                <p className={classes.categoryText}>
                    Posted in -
                </p>
            );
        }
    }

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
        <div className={`${classes.blogpostItem} ${classes.blogpostItemList}`}>
            <div>
                {/* <h2>{title}</h2> */}
                <Link className={classes.mainTitle} to={`/blog/post/${url_key}`}>
                    {title}
                </Link>
                <div className="d-flex align-items-center">
                    <p className={classes.dateTitle}>{formatDate(publish_date)}</p>
                </div>
            </div>
            {featured_image_url ? (
                <div className={classes.blogpostItemCol1}>
                    <img src={featured_image_url} alt={title} />
                </div>
            ) : (
                ''
            )}
            <div className={classes.blogpostItemCol2}>
                <div className={classes.blogpostDescription}>
                    <RichText
                        classes={{ root: classes.blogpostDescriptionRichtext }}
                        content={short_content}
                    />
                </div>

                <Link className={classes.readMoreButtonLink} to={`/blog/post/${url_key}`}>
                    Read More
                </Link>
            </div>
            <div className={classes.categoryWrapper}>
                <PostedComponent />
            </div>
        </div>
    );
};

export default BlogItem;
