import { useState } from 'react'

const useSwitcher = (props = {}) => {
    const stateProps = useState(props.initialValue);

    return {
        options: props.options,
        stateProps,
    };
};

export default useSwitcher;
