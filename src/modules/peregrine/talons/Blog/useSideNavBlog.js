import { getCategory, getRecentPost } from './Blog.gql';
import { useQuery } from '@apollo/client';

export const useSideNavBlog = () => {
    const { data: categoryData, loading: categoryLoading } = useQuery(
        getCategory
    );
    const { data: recentData, loading: recentLoading } = useQuery(
        getRecentPost, 
        {
            variables: {
                page_size: 5,
                current_page: 1
            }
        }
    );

    return {
        categoryData,
        categoryLoading,
        recentData,
        recentLoading
    };
};