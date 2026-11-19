import { useState, useCallback } from 'react';

export const useItem = props => {
    const { id, product, custom_price, quantity, handleRemoveItem } = props;

    const [isDeleting, setIsDeleting] = useState(false);

    const removeItem = useCallback(() => {
        setIsDeleting(true);
        handleRemoveItem(id, product, custom_price, quantity);
    }, [handleRemoveItem, id]);

    return {
        isDeleting,
        removeItem
    };
};
