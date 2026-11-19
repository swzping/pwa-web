import { useCallback, useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useHistory, useLocation } from 'react-router-dom';
import { useWindowSize } from '@magento/peregrine';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useDropdown } from '@magento/peregrine/lib/hooks/useDropdown';

/**
 * Routes to hide the mini cart on.
 */
const DENIED_MINI_CART_ROUTES = ['/checkout'];

/**
 *
 * @param {DocumentNode} props.queries.getItemCountQuery query to get the total cart items count
 *
 * @returns {
 *      itemCount: Number,
 *      miniCartIsOpen: Boolean,
 *      handleLinkClick: Function,
 *      handleTriggerClick: Function,
 *      miniCartRef: Function,
 *      hideCartTrigger: Function,
 *      setMiniCartIsOpen: Function
 *  }
 */
export const useCartTrigger = props => {
    const {
        queries: { getItemCountQuery }
    } = props;

    const [
        { cartId, isCartObsolete },
        {
            actions: { updateCartObsolete }
        }
    ] = useCartContext();
    const [{ isSignedIn }] = useUserContext();
    const history = useHistory();
    const location = useLocation();
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 768;
    const [isHidden, setIsHidden] = useState(() =>
        DENIED_MINI_CART_ROUTES.includes(location.pathname)
    );

    const {
        elementRef: miniCartRef,
        expanded: miniCartIsOpen,
        setExpanded: setMiniCartIsOpen,
        triggerRef: miniCartTriggerRef
    } = useDropdown();

    const { data, refetch } = useQuery(getItemCountQuery, {
        fetchPolicy: 'cache-and-network',
        variables: {
            cartId
        },
        skip: !isSignedIn || !cartId
    });

    const itemCount = useMemo(() => {
        if (data) {
            return data.cart?.total_quantity;
        }
        return 0;
    }, [data]);

    const handleTriggerClick = useCallback(() => {
        // Open the mini cart.
        if(isMobile) {
            history.push('/cart')
        }else {
            setMiniCartIsOpen(isOpen => !isOpen);
        }
    }, [setMiniCartIsOpen]);

    const handleLinkClick = useCallback(() => {
        // Send the user to the checkout page via a full page load (not the
        // client-side router), same as the PriceSummary checkout button.
        window.location.href = '/checkout';
    }, []);

    useEffect(async () => {
        if (isCartObsolete) {
            refetch();
            updateCartObsolete(false);
        }
    }, [isCartObsolete]);

    useEffect(() => {
        setIsHidden(DENIED_MINI_CART_ROUTES.includes(location.pathname));
    }, [location]);

    return {
        handleLinkClick,
        handleTriggerClick,
        data,
        itemCount,
        miniCartIsOpen,
        miniCartRef,
        hideCartTrigger: isHidden,
        setMiniCartIsOpen,
        miniCartTriggerRef
    };
};
