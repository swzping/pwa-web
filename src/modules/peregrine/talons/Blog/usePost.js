import { useQuery } from '@apollo/client';
import { getPostByUrlKey, getCategory } from './Blog.gql';

export const usePost = props => {
    const { postUrl } = props;

    const { data: postData, loading: postLoading } = useQuery(getPostByUrlKey, {
        variables: {
            url_key: postUrl
        },
        skip: !postUrl
    });

    const { data: categoryData, loading: categoryLoading } = useQuery(
        getCategory
    );

    return {
        postData,
        postLoading,
        categoryData,
        categoryLoading
    };
};
