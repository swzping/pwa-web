import React from 'react';

export const CustomizableDropdown = React.lazy(() =>
    import('./customizableDropdown')
);
export const CustomizableRadio = React.lazy(() =>
    import('./customizableRadio')
);
export const CustomizableCheckbox = React.lazy(() =>
    import('./customizableCheckbox')
);
export const CustomizableMultiple = React.lazy(() =>
    import('./customizableMultiple')
);

export {
    isCustomizableDropdown,
    isCustomizableRadio,
    isCustomizableCheckbox,
    isCustomizableMultiple
} from './isProductCustomizable';
