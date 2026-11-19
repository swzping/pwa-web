import React from 'react';
import { useCartTrigger } from '../../../peregrine/talons/Header/useCartTrigger';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { Cart2Outlined } from '@/assets/icons'
import { Cart } from '@/assets/icons'

import defaultClasses from './cartTrigger.module.css';
import { GET_ITEM_COUNT_QUERY } from './cartTrigger.gql';

const MobileCart = props => {

    const {
        itemCount,
    } = useCartTrigger({
        queries: {
            getItemCountQuery: GET_ITEM_COUNT_QUERY
        }
    });
    const classes = useStyle(defaultClasses, props.classes);
   
    const itemCountDisplay = itemCount > 99 ? '99+' : itemCount;
    

    

    return <div className={classes.mobileCart}>
        {itemCount > 0 ? <Cart color="#FF8200" style={{fontSize: '30px'}}></Cart> : <Cart2Outlined /> }
        {itemCount > 0 ? <div className={classes.mobileItemNum}>{itemCountDisplay}</div> : null }
    </div>;
};

export default MobileCart;
