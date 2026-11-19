import React, { useCallback } from "react";
import { useIntl } from "react-intl";
import { shape, string, func } from "prop-types";
import { X as Remove } from "react-feather";

import { useStyle } from "@magento/venia-ui/lib/classify";
import Icon from "@magento/venia-ui/lib/components/Icon";
import Trigger from "@magento/venia-ui/lib/components/Trigger";
import defaultClasses from "@magento/venia-ui/lib/components/FilterModal/CurrentFilters/currentFilter.module.css";
import { CloseOutlined } from '../../../../../assets/icons';

const CurrentFilter = props => {
    const { group, item, removeItem, onRemove } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const { formatMessage } = useIntl();

    const handleClick = useCallback(() => {
        removeItem({ group, item });
        if (typeof onRemove === 'function') {
            onRemove(group, item);
        }
    }, [group, item, removeItem, onRemove]);

    const ariaLabel = formatMessage(
        {
            id: 'filterModal.action.clearFilterItem.ariaLabel',
            defaultMessage: 'Clear filter'
        },
        {
            name: item.title
        }
    );

    return (
        <span className={classes.root}>

            {/* <span className={classes.groupName}>{group}</span>
            <span>:</span> */}
            <span className={classes.text}>
                {item.title === "0" ?
                    "No" :
                    item.title === "1" ?
                        "Yes" :
                        item.title
                }
            </span>
            <Trigger action={handleClick} ariaLabel={ariaLabel}>
                <Icon src={CloseOutlined} size={16}/>
            </Trigger>
        </span>
    );
};

export default CurrentFilter;

CurrentFilter.defaultProps = {
    onRemove: null
};

CurrentFilter.propTypes = {
    classes: shape({
        root: string
    }),
    onRemove: func
};
